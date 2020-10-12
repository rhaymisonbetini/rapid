import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Environment, GoogleMap, GoogleMapOptions, GoogleMaps, GoogleMapsAnimation, GoogleMapsEvent, MyLocation } from '@ionic-native/google-maps';
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

  public searchResults: Array<any>;

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

      this.map.addMarkerSync({
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
        input: this.search
      }, predictions => {
        this.ngZone.run(() => {
          this.searchResults = predictions
        })
      })
    }
  }

  calRoutes(result) {
    this.searchResults = [];


  }

}
