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


## WooCommerceSoftwareAddOn Methods

These methods are available for use after the class `WooCommerceSoftwareAddOn` is initialized.


### `generateKey`

This can be used to generate a new keys. This is based on the `generate_key` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-10).

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| secret_key    | Secret product key for use with the API                                                  |
| email         | Email to generate the license key for, default: email set during [initialization](#initialization) |
| order_id      | Optional order ID to link the license key to, default: null                              |
| version       | Optional version information of the software license, default: null                      |
| key_prefix    | Optional prefix for generated license keys, default: null                                |
| activations   | Amount of activations possible per license key, default: 1                               |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)


### `activateLicense`

This can be used to activate a single instance of a license key. This is based on the `activation` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-11).

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| license_key   | License key to activate for the software                                                 |
| instance      | Pass to activate existing uses (previously deactivated), default: null, ignored          |
| platform      | Optional platform information that can be used to identify unique systems, default: null |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)


### `resetLicense`

This can be used to reset/deactivate all activations of a license key. This is based on the `activation_reset` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-12).

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| license_key   | License key to reset all activations                                                     |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)


### `deactivateLicense`

This can be used to deactivate a single activations of a license key. This is based on the `deactivation` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-13).

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| license_key   | License key to deactivate single activation                                              |
| instance      | Pass to deactivate existing uses (previously activated), default: null, ignored          |
| activation_id | Pass to only deactivate a single use, default: null, ignored                             |

If both `instance` and `license_key` are `null` (or not provided), this will deactivate the oldest activation of the license key.

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)


### `checkLicense`

This can be used to check the activation status of a license key. This is based on the `check` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-14).

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| license_key   | License key to validate a single activation                                              |
| timestamp     | Pass to check the timestamp of the activation, default: 0, ignored                       |
| platform      | Pass to check the platform used during activation,.default: null, auto-generated info    |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)


### `getActivations`

This can be used to list the existing activations of a license key. This is based on the `check` API call as documented [here](https://woocommerce.com/document/software-add-on/#section-14).


| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| license_key   | License key to check for activations                                                     |

Return: [`Promise<Array<WooCommerceSoftwareActivations> | null>`](#woocommercesoftwareactivations)

## Usage Example

Activating License and Checking Activation

``` javascript
const { WooCommerceSoftwareAddOn } = require("woocommerce-software-add-on");

let licenseKey = "example-license-key";
let licenseManager = new WooCommerceSoftwareAddOn("example.com", "example_product_id", "example@example.com");

(async () => {

    // Activate License
    let instance = await licenseManager.activateLicense(licenseKey).then(async (value) => {
        // Initial attempt
        if (value.success) {
            return value.output.instance;
        } else if (value.output.code == 103) {
            // Deactivate oldest activation
            await licenseManager.deactivateLicense(licenseKey);
            // Retry activation
            return await licenseManager.activateLicense(licenseKey).then(value => {
                return value.output.instance;
            });
        } else {
            return null;
        }
    });
    // Save 'instance' for License Checking
    console.log(instance);

    // Check if the license key is activated with the saved instance
    let activated = await licenseManager.checkLicense(licenseKey, instance).then(async (value) => {
        return value.success;
    });
    console.log(activated);

})();
```

## Additional Methods

Some methods are also exported so it is usable without the need to create a `WooCommerceSoftwareAddOn` instance. For these methods, hostname, product id and email are added as required arguments/parameters.

### `generateKey`

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| hostname      | Wordpress site hosting the WooCommerce Software Add-on plugin                            |
| product_id    | Product ID designated for the software license                                           |
| email         | Email address to validate the check activations of                                       |
| secret_key    | Secret product key for use with the API                                                  |
| order_id      | Optional order ID to link the license key to, default: null                              |
| version       | Optional version information of the software license, default: null                      |
| key_prefix    | Optional prefix for generated license keys, default: null                                |
| activations   | Amount of activations possible per license key, default: 1                               |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)

Example

``` javascript
const { generateKey } = require("woocommerce-software-add-on");

(async () => {

    let licenseKey = await generateKey("example.com", "example_product_id", "example@example.com", "examplesecretkey").then(value => {
        if (value.success) {
            return value.output.key;
        } else {
            return null;
        }
    });
    console.log(licenseKey);

})();
```

### `checkLicense`

| Argument      | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| hostname      | Wordpress site hosting the WooCommerce Software Add-on plugin                            |
| product_id    | Product ID designated for the software license                                           |
| email         | Email address to validate the check activations of                                       |
| license_key   | License key to validate a single activation                                              |
| timestamp     | Pass to check the timestamp of the activation, default: 0, ignored                       |
| platform      | Pass to check the platform used during activation,.default: null, auto-generated info    |

Return: [`Promise<WooCommerceSoftwareResult>`](#woocommercesoftwareresult)

Example

``` javascript
const { checkLicense } = require("woocommerce-software-add-on");

(async () => {
    
    let activated = await checkLicense("example.com", "example_product_id",
        "example@example.com", "example-license-key", "example-timestamp").then(value => {
        return (value.success);
    });
    console.log(activated);

})();
```

## Interface Types

### `WooCommerceSoftwareResult`

Most methods/functions from the module can returns a Promise of this type. This interface type is an object with the following keys:

| Key           | Description                                                                              |
|:-------------:|:---------------------------------------------------------------------------------------- |
| success       | Indicates whethere the operation was a success or not                                    |
| code          | HTTP code or API error code                                                              |
| headers       | HTTP headers response received to the API request                                        |
| output        | Actual JSON response to the API request, if API call received a proper API response      |
| error         | Error that occurred during the API request or as indicated by the API response           |


### `WooCommerceSoftwareActivations`

The [`getActivations`](#getactivations) returns a promise of an array of this type when used. This type is also contained withing the response to [`checkLicense`](#checklicense). This type is an object with the following keys:

| Key                 | Description                                                                        |
|:-------------------:|:---------------------------------------------------------------------------------- |
| activation_id       | ID associated with the activation                                                  |
| instance            | Usually a timestamp of the activation, or as indicated during activation           |
| activation_platform | As indicated during activation                                                     |
| activation_time     | Actual JSON response to the API request if API call received a proper API response |

