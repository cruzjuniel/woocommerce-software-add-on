
import os = require("os");
import https = require('https');
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
})}`;

const noEmailError: WooCommerceSoftwareResult = {
    success: false,
    code: undefined,
    headers: null,
    output: null,
    error: "No email set"
};

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

// generate_key: https://woocommerce.com/document/software-add-on/#section-10
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

// check: https://woocommerce.com/document/software-add-on/#section-14
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
    hostname: string;
    product_id: string;
    email: string | null;

    constructor(hostname: string, product_id: string, email: string | null = null) {
        this.hostname = hostname;
        this.product_id = product_id;
        this.email = email;
    }

    // generate_key: https://woocommerce.com/document/software-add-on/#section-10
    async generateKey(secret_key: string, email: string | null = null, order_id: string | null = null, version: string | null = null, key_prefix: string | null = null, activations: number = 1): Promise<WooCommerceSoftwareResult> {
        let _email: string | null = email != null ? email : this.email;
        if (_email == null) return noEmailError;
        return generateKey(this.hostname, this.product_id, _email, secret_key, order_id, version, key_prefix, activations);
    }

    // activation: https://woocommerce.com/document/software-add-on/#section-11
    async activateLicense(license_key: string, instance: string | null = null, platform: string | null = null, secret_key: string | null = null): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return await this.getRequest("activation", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
            instance: instance,
            platform: platform != null ? platform : systemInfo,
            secret_key: secret_key
        });
    }

    // activation_reset: https://woocommerce.com/document/software-add-on/#section-12
    async resetLicense(license_key: string): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return await this.getRequest("activation_reset", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id
        });
    }

    // deactivation: https://woocommerce.com/document/software-add-on/#section-13
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

    // check: https://woocommerce.com/document/software-add-on/#section-14
    async checkLicense(license_key: string, timestamp: string | number = 0, platform: string | null = null): Promise<WooCommerceSoftwareResult> {
        if (this.email == null) return noEmailError;
        return checkLicense(this.hostname, this.product_id, this.email, license_key, timestamp, platform != null ? platform : systemInfo);
    }

    // check: https://woocommerce.com/document/software-add-on/#section-14
    async getActivations(license_key: string): Promise<Array<WooCommerceSoftwareActivations> | null> {
        if (this.email == null) return null;
        return await checkLicense(this.hostname, this.product_id, this.email, license_key, "", "").then(value => {
            if (value.success) return (value.output as WooCommerceSoftwareCheckSuccess).activations;
            return null;
        });
    }

    private async getRequest(request: string, args: { [key: string]: string | null }): Promise<WooCommerceSoftwareResult> {
        return getRequest(this.hostname, request, args);
    }
}