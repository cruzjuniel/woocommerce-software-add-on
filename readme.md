# WooCommerce Software Add-on NodeJS module

A simple implementation of WooCommerce's Software Add-on API.


## Installation

Install module by running the command:

    npm install woocommerce-software-add-on

or from the GitHub repository:

    npm install git+https://github.com/cruzjuniel/woocommerce-software-add-on.git


## Initialization

The module exports the class `WooCommerceSoftwareAddOn`. Add this class from the module to your javascript project using:

    const { WooCommerceSoftwareAddOn } = require("woocommerce-software-add-on");

Create a new instance of the class by specifying the hostname and product ID:

    let licenseManager = new WooCommerceSoftwareAddOn("example.com", "example");

Optionally, an email can also be specified:

    let licenseManager = new WooCommerceSoftwareAddOn("example.com", "example", "example@example.com");

## Methods

TODO

## Usage Example

``` javascript
const { WooCommerceSoftwareAddOn } = require("woocommerce-software-add-on");

let licenseManager = new WooCommerceSoftwareAddOn("example.com", "example", "example@example.com");

licenseManager.checkLicense("example-license-key").then(value => {
    console.log(value);
    // Check if request is successful
    if (value.success) {
        // if it is, log output
        console.log(value.output);
    } else {
        // otherwise, log error
        console.error(value.error);
    }
});
```