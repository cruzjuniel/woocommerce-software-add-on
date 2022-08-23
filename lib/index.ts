
import os from 'os';
import https from 'https';
import { machineIdSync } from 'node-machine-id';
import {
    WooCommerceSoftwareResult,
    WooCommerceSoftwareCheckSuccess,
    WooCommerceSoftwareActivations,
    WooCommerceSoftwareApiError
} from "./types";

const systemInfo = `${os.hostname()} (${os.platform()}) ${os.cpus().map(cpu => {
    return cpu.model;
}).filter((cpu, index, self) => {
    return self.indexOf(cpu) === index;
})} (${machineIdSync()})`;

const noEmailError: WooCommerceSoftwareResult = {
    success: false,
    code: undefined,
    headers: null,
    output: null,
    error: "No email set"
};

/**
 * A simple utility function to send API request to the WooCommerce Software Add-on
 * @param hostname The hostname/domain of the Wordpress/WooCommerce site
 * @param request Type of API request to be sent to the Wordpress/WooCommerce site
 * @param args Key-value containing the required and optional parameters for the request
 * @returns Promise<WooCommerceSoftwareResult>
 */
async function getRequest(hostname: string, request: string, args: { [key: string]: string | null }): Promise<WooCommerceSoftwareResult> {
    let requestPath: string = "/woocommerce/?";
    let searchParams: URLSearchParams = new URLSearchParams(`wc-api=software-api&request=${request}`);

    Object.keys(args).forEach(key => {
        if (args[key]) {
            searchParams.append(key, String(args[key]));
        }
    });

    requestPath += searchParams.toString();

    return await new Promise<WooCommerceSoftwareResult>(resolve => {
        https.get({
            hostname: hostname,
            path: requestPath
        }, (res) => {

            if (res.statusCode !== undefined && res.statusCode == 200) {

                let data: string = "";

                // A chunk of data has been received.
                res.on('data', (d) => {
                    data += d;
                });

                // The whole response has been received. Print out the result.
                res.on('end', () => {

                    let json = {};

                    try {
                        json = JSON.parse(data);
                    } catch (e) {
                        resolve({
                            success: false,
                            code: res.statusCode,
                            headers: res.headers,
                            output: data,
                            error: e
                        });
                    }

                    let err = (json as WooCommerceSoftwareApiError);

                    if (err.error !== undefined) {
                        resolve({
                            success: false,
                            code: err.code,
                            headers: res.headers,
                            output: json,
                            error: `Code ${err.code}: ${err.error}`
                        });
                    }

                    resolve({
                        success: true,
                        code: res.statusCode,
                        headers: res.headers,
                        output: json,
                        error: "No error occurred"
                    });
                });

            } else {

                resolve({
                    success: false,
                    code: res.statusCode,
                    headers: res.headers,
                    output: null,
                    error: `Status code is ${res.statusCode}`
                });

            }

        }).on('error', (e) => {

            resolve({
                success: false,
                code: 0,
                headers: null,
                output: null,
                error: e
            });

        });
    });
}

/**
 * A simple standalone implementation of [generate_key](https://woocommerce.com/document/software-add-on/#section-10) request
 * @param hostname The hostname/domain of the Wordpress/WooCommerce site
 * @param product_id The product ID representing the software product to generate license key for
 * @param email The user email to link the license key with
 * @param secret_key The secret key tied to the software product
 * @param order_id The order ID to link the license key with, default: null (_ignored_)
 * @param version Software version to use with the license key, default: null (_ignored_)
 * @param key_prefix A string to prepend the generated key with, default: null (_ignored_)
 * @param activations Number of activations allowable for the license key, default: 1
 * @returns Promise<WooCommerceSoftwareResult>
 */
export async function generateKey(hostname: string, product_id: string, email: string, secret_key: string, order_id: string | null = null, version: string | null = null, key_prefix: string | null = null, activations: number = 1): Promise<WooCommerceSoftwareResult> {
    return await getRequest(hostname, "generate_key", {
        secret_key: secret_key,
        email: email,
        product_id: product_id,
        order_id: order_id,
        version: version,
        key_prefix: key_prefix,
        activations: String(activations)
    });
}

/**
 * A simple standalone implementation of [check](https://woocommerce.com/document/software-add-on/#section-14) request
 * @param hostname The hostname/domain of the Wordpress/WooCommerce site
 * @param product_id The product ID representing the software product to check the license key with
 * @param email The user email to check the license key with
 * @param license_key The license key to check for activations
 * @param timestamp A previously recorded timestamp/instance to test existing activations with, default: 0 (_ignored_)
 * @param platform The platform that is tied to the license activation, default: null (_ignored_)
 * @returns Promise<WooCommerceSoftwareResult>
 */
export async function checkLicense(hostname: string, product_id: string, email: string, license_key: string, timestamp: string | number = 0, platform: string | null = null): Promise<WooCommerceSoftwareResult> {
    let result: WooCommerceSoftwareResult = await getRequest(hostname, "check", {
        email: email,
        license_key: license_key,
        product_id: product_id
    });
    if (result.success) {
        let activations: Array<WooCommerceSoftwareActivations> = (result.output as WooCommerceSoftwareCheckSuccess).activations;
        let checkPlatform = platform != null ? platform : systemInfo;
        if (activations.length == 0) {
            result.success = false;
            result.error = "Software key is not yet activated";
        } else if (activations.find(activation => {
            // if timestamp is 0 (no timestamp was provided), instance is ignored
            // if activation_platform is empty string (no platform was recorded for the activation), platform is ignored
            return (timestamp == 0 || activation.instance == String(timestamp)) && ((activation.activation_platform == "") || (checkPlatform == activation.activation_platform));
        }) === undefined) {
            result.success = false;
            result.error = `No matching timestamp '${timestamp}' and/or platform '${checkPlatform}'`;
        }
    }
    return result;
}

export class WooCommerceSoftwareAddOn {
    private hostname: string;
    private product_id: string;
    private email: string | null;

    /**
     * WooCommerceSoftwareAddOn Constructor
     * @param hostname The hostname/domain of the Wordpress/WooCommerce site
     * @param product_id The product ID representing the software product
     * @param email The user email to use for the API requests, default: null
     */
    constructor(hostname: string, product_id: string, email: string | null = null) {
        this.hostname = hostname;
        this.product_id = product_id;
        this.email = email;
    }

    /**
     * A simple setter function to use if class is constructed without an email
     * @param email The user email to use for the API requests
     */
    setEmail(email: string): void {
        this.email = email;
    }

    /**
     * A class method implementation of [generate_key](https://woocommerce.com/document/software-add-on/#section-10) request
     * @param secret_key The secret key tied to the software product
     * @param email The user email to link the license key with, default: null (_uses email set in constructor_)
     * @param order_id The order ID to link the license key with, default: null (_ignored_)
     * @param version Software version to use with the license key, default: null (_ignored_)
     * @param key_prefix A string to prepend the generated key with, default: null (_ignored_)
     * @param activations Number of activations allowable for the license key, default: 1
     * @returns Promise<WooCommerceSoftwareResult>
     */
    async generateKey(secret_key: string, email: string | null = null, order_id: string | null = null, version: string | null = null, key_prefix: string | null = null, activations: number = 1): Promise<WooCommerceSoftwareResult> {
        let _email: string | null = email != null ? email : this.email;
        if (_email == null) return noEmailError;
        return generateKey(this.hostname, this.product_id, _email, secret_key, order_id, version, key_prefix, activations);
    }

    /**
     * A class method implementation of [activation](https://woocommerce.com/document/software-add-on/#section-11) request
     * @param license_key The license key to activate for the current system
     * @param instance Pass to activate existing uses (previously deactivated), default: null (_ignored_)
     * @param platform The platform information that can be used to identify unique systems, default: null (_ignored_)
     * @returns Promise<WooCommerceSoftwareResult>
     */
    async activateLicense(license_key: string, instance: string | null = null, platform: string | null = null): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return await this.getRequest("activation", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
            instance: instance,
            platform: platform != null ? platform : systemInfo
        });
    }

    /**
     * A class method implementation of [activation_reset](https://woocommerce.com/document/software-add-on/#section-12) request
     * @param license_key The license key to reset all activations in the Wordpress/WooCommerce site
     * @returns Promise<WooCommerceSoftwareResult>
     */
    async resetLicense(license_key: string): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return await this.getRequest("activation_reset", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id
        });
    }

    /**
     * A class method implementation of [deactivation](https://woocommerce.com/document/software-add-on/#section-13) request
     * @param license_key The license key to deactivate a single activation of
     * @param instance Pass to deactivate existing uses (previously activated), default: null (_ignored_)
     * @param activation_id Pass to deactivate existing uses (previously activated), default: null (_ignored_)
     * @returns Promise<WooCommerceSoftwareResult>
     */
    async deactivateLicense(license_key: string, instance: string | null = null, activation_id: string | null = null): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return await this.getRequest("deactivation", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
            instance: instance,
            activation_id: activation_id
        });
    }

    /**
     * A class method implementation of [check](https://woocommerce.com/document/software-add-on/#section-14) request
     * @param license_key The license key to check for activations
     * @param timestamp A previously recorded timestamp/instance to test existing activations with, default: 0 (_ignored_)
     * @param platform The platform that is tied to the license activation, default: null (_ignored_)
     * @returns Promise<WooCommerceSoftwareResult>
     */
    async checkLicense(license_key: string, timestamp: string | number = 0, platform: string | null = null): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return checkLicense(this.hostname, this.product_id, this.email, license_key, timestamp, platform != null ? platform : systemInfo);
    }

    /**
     * An extended implementation [check](https://woocommerce.com/document/software-add-on/#section-14) request which returns a promise
     * @param license_key The license key to check for activations
     * @returns Promise<Array<WooCommerceSoftwareActivations> | null | undefined> 
     * 
     *      **Array<WooCommerceSoftwareActivations>** if check request was successful
     * 
     *      **null** if check request was unsuccessful, or;
     * 
     *      **undefined** if no email is set
     */
    async getActivations(license_key: string): Promise<Array<WooCommerceSoftwareActivations> | null | undefined> {
        if (this.email == null) return undefined;
        return await checkLicense(this.hostname, this.product_id, this.email, license_key, "", "").then(value => {
            if (value.success) return (value.output as WooCommerceSoftwareCheckSuccess).activations;
            return null;
        });
    }

    /**
     * A simple utility method to send API request to the WooCommerce Software Add-on
     * @param request Type of API request to be sent to the Wordpress/WooCommerce site
     * @param args Key-value containing the required and optional parameters for the request
     * @returns Promise<WooCommerceSoftwareResult>
     */
    private async getRequest(request: string, args: { [key: string]: string | null }): Promise<WooCommerceSoftwareResult> {
        return getRequest(this.hostname, request, args);
    }
}