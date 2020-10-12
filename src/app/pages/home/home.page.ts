import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { async } from '@angular/core/testing';
import { Environment, Geocoder, GoogleMap, GoogleMapOptions, GoogleMaps, GoogleMapsAnimation, GoogleMapsEvent, ILatLng, Marker, MyLocation } from '@ionic-native/google-maps';
import { LoadingController, Platform } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('map', { static: true }) mapElement: any;

  private loading: any;
  private map: GoogleMap

  public search: string = '';

  private googleAutoComplete = new google.maps.places.AutocompleteService();
  private googleDireactionService = new google.maps.DirectionsService();

  public searchResults: Array<any>;

  private originMarker: Marker;
  public destination: any;

  public findDelivery: Boolean = false;
  public selectedDelivery: Boolean = false;
  public showDeliver: Boolean = false;
  public cancel: Boolean = false;

  constructor(
    private platform: Platform,
    private loadingController: LoadingController,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.mapElement = this.mapElement.nativeElement;
    this.mapElement.style.width = this.platform.width() + 'px';
    this.mapElement.style.height = this.platform.height() + 'px';

    this.loadingMap();

  }

  async loadingMap() {
    this.loading = await this.loadingController.create({ message: "Carregando mapa....." });
    await this.loading.present();

    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyBv9qTvXg5ihjrkAsFL-WWhmSNrJGymiSw',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyBv9qTvXg5ihjrkAsFL-WWhmSNrJGymiSw'
    });

    const mapOptions: GoogleMapOptions = {
      controls: {
        zoom: false
      }
    }

    this.map = GoogleMaps.create(this.mapElement, mapOptions);

    try {
      this.map.one(GoogleMapsEvent.MAP_READY);
      this.addOriginMarker();
    } catch (e) {
      console.log(e)
    }

  }

  async addOriginMarker() {
    let myLocation: MyLocation;
    return this.map.getMyLocation().then((res: MyLocation) => {
      myLocation = res;
      this.loading.dismiss();

      this.map.moveCamera({
        target: myLocation.latLng,
        zoom: 18
      })

      this.originMarker = this.map.addMarkerSync({
        title: "Origem",
        icon: '#FF4500',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng
      })


    }, error => {
      console.log(error);
      this.loading.dismiss();
    });
  }


  //metodos auxiliares
  searchChange() {
    if (!this.search.trim().length) {
      this.searchResults = [];
      return
    } else {
      this.googleAutoComplete.getPlacePredictions({
        input: this.search,
        country: 'br',
      }, predictions => {
        this.ngZone.run(() => {
          this.searchResults = predictions
        })
      })
    }
  }

  async calRoutes(result: any) {
    this.searchResults = [];
    this.destination = result;

    const info: any = await Geocoder.geocode({
      address: this.destination.description,
    })

    let markDestionation: Marker = this.map.addMarkerSync({
      title: this.destination.description,
      icon: '#000',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position
    });


    this.googleDireactionService.route({
      origin: this.originMarker.getPosition(),
      destination: markDestionation.getPosition(),
      travelMode: 'DRIVING'
    }, async result => {

      const points = new Array<ILatLng>();
      const routes = result.routes[0].overview_path;

      for (let i = 0; i < routes.length; i++) {
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }

      await this.map.addPolyline({
        points: points,
        color: '#FF4500',
        width: 3
      });

      this.findDelivery = true;
      this.removeOpacity()
      await this.map.moveCamera({ target: points });
      await this.map.panBy(0, 100);


    })

  }

  async getDelivery() {
    this.loading = await this.loadingController.create({ message: "Procurando entregador..." });
    await this.loading.present();

    let driver = 'Cobilândia, Vila Velha - ES, Brasil';
    const info: any = await Geocoder.geocode({
      address: driver
    })

    let markDeliveryOrigom: Marker = this.map.addMarkerSync({
      title: "Entregador",
      icon: '#00BFFF',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position
    });

    this.googleDireactionService.route({
      origin: markDeliveryOrigom.getPosition(),
      destination: this.originMarker.getPosition(),
      travelMode: 'DRIVING'
    }, async result => {

      const points = new Array<ILatLng>();
      const routes = result.routes[0].overview_path;

      for (let i = 0; i < routes.length; i++) {
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }

      await this.map.addPolyline({
        points: points,
        color: '#0000CD',
        width: 3
      });

      this.loading.dismiss();
      this.showDeliver = true;
      await this.map.moveCamera({ target: points });
      this.map.panBy(0, 100);
    })

  }

  confirmDelivery() {
    this.selectedDelivery = true;
    this.showDeliver = false;
    this.cancel = true;
  }

  removeOpacity() {
    document.getElementById('delivery').classList.add('remove-opacity');
  }


  async back() {
    this.map.clear().then(() => {

      this.destination = null;
      this.search = ''
      this.addOriginMarker();

    }).catch(error => {
      console.log(error)
    })

  }

  async cancelDelivery() {
    this.map.clear().then(() => {
      this.cancel = false;
      this.selectedDelivery = false;
      this.findDelivery  = false;
      this.destination = null;
      this.search = ''
      this.addOriginMarker();

    }).catch(error => {
      console.log(error)
    })
  }

}
