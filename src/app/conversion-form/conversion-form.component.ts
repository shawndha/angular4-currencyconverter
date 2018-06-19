import { Component, AfterViewInit, OnInit  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Chart from 'chart.js'
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {DatePipe} from '@angular/common';
declare var require: any;

@Component({
  selector: 'app-conversion-form',
  templateUrl: './conversion-form.component.html',
  styleUrls: ['./conversion-form.component.css']
})
export class ConversionFormComponent implements AfterViewInit, OnInit {
  // get list of country names with currency codes
  countryCodes: object = require('../../data/countries.json');
  // default cad to usd
  defaultFromRate: object = this.countryCodes[25];
  defaultToRate: object = this.countryCodes[140];
  currencyConverter: FormGroup;
  // chartjs
  canvas: any;
  ctx: any;
  constructor(private http: HttpClient,  public datepipe: DatePipe) {
    this.currencyConverter = new FormGroup({
      fromRate: new FormControl(this.defaultFromRate),
      fromAmount: new FormControl(1, [
        Validators.required,
        Validators.pattern("^[1-9]\\d*(\\.\\d+)?$"),
        Validators.minLength(1),
      ]),
      toRate: new FormControl(this.defaultToRate),
      toAmount: new FormControl(null),
      conversionRate: new FormControl(null),
    });
  }
  ngOnInit() {
    // Get conversion rate and do conversion
    // TODO Make into service
    this.http.get('https://www.currencyconverterapi.com/api/v5/convert?q=CAD_USD&compact=y&apiKey=57c41219-45dc-4614-988a-7ab20c416f3f', { responseType: 'json' }).subscribe(result => {
      this.currencyConverter.controls['conversionRate'].setValue(result[Object.keys(result)[0]].val.toFixed(4), {onlySelf: true});
      this.currencyConverter.controls['toAmount'].setValue(result[Object.keys(result)[0]].val.toFixed(4), {onlySelf: true});
    });
  }

  ngAfterViewInit() {
    // load graph
    const todaysDate = new Date();
    const month = todaysDate.getMonth() + 1;
    const dateFormatted: string = todaysDate.getFullYear() + '-' + month + '-' + todaysDate.getDate();
    // TODO make get request from last 5 days only
    const getUrl = 'https://www.currencyconverterapi.com/api/v5/convert?q=' + this.currencyConverter.controls['fromRate'].value.cc + '_' + this.currencyConverter.controls['toRate'].value.cc + '&compact=y&apiKey=57c41219-45dc-4614-988a-7ab20c416f3f&date=2018-01-01&endDate=' + dateFormatted;
    let dataGather: number[] = [];
    let dateGather: String[] = [];
    // TODO Make into service
    this.http.get(getUrl, { responseType: 'json' }).subscribe(result => {
      for (const [key, value] of Object.entries(result[Object.keys(result)[0]].val)) {
        dataGather.push(Number(value));
        dateGather.push(key);
      }

      // get last 5 days
      dataGather = dataGather.slice(Math.max(dataGather.length - 5, 1));
      dateGather = dateGather.slice(Math.max(dateGather.length - 5, 1));
      // update chart
      this.canvas = document.getElementById('currencyChangeChart');
      this.ctx = this.canvas.getContext('2d');
      let currencyChangeChart = new Chart(this.ctx, {
        type: 'line',
        data: {
          labels: dateGather,
          datasets: [{
            label: 'Change in last 5 days',
            data: dataGather,
            backgroundColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)'
            ],
            borderColor: 'rgba(255, 99, 132, 1)',
            fill: false,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          display: true
        }
      });
    });

  }
  // end chartjs code
  // executes when user updates numbers
  updateValues() {
    const getUrl = 'https://www.currencyconverterapi.com/api/v5/convert?q=' + this.currencyConverter.controls['fromRate'].value.cc + '_' + this.currencyConverter.controls['toRate'].value.cc + '&compact=y&apiKey=57c41219-45dc-4614-988a-7ab20c416f3f';
    // TODO Make into service
    // get conversion rate and do conversion, set form values
    this.http.get(getUrl, { responseType: 'json' }).subscribe(result => {
      this.currencyConverter.controls['conversionRate'].setValue(result[Object.keys(result)[0]].val.toFixed(4), {onlySelf: true});
      const converted = (this.currencyConverter.controls['fromAmount'].value * this.currencyConverter.controls['conversionRate'].value).toFixed(2);
      this.currencyConverter.controls['toAmount'].setValue(converted, {onlySelf: true});
    });
  }
  // executes when user changes currency values
  updateChart() {
    this.ngAfterViewInit();
    this.updateValues();
  }



}
