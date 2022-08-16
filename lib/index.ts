import https = require('https');


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
    async generateKey(secret_key: string, order_id: string | null = null, version: string | null = null, key_prefix: string | null = null, activations: number = 1): Promise<object> {
        return await this.getRequest("generate_key", {
            secret_key: secret_key,
            email: this.email,
            product_id: this.product_id,
            order_id: order_id,
            version: version,
            key_prefix: key_prefix,
            activations: String(activations)
        });
    }

    // activation: https://woocommerce.com/document/software-add-on/#section-11
    async activateLicense(license_key: string, instance: string | null = null, platform: string | null = null, secret_key: string | null = null): Promise<object> {
        return await this.getRequest("activation", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
            instance: instance,
            platform: platform,
            secret_key: secret_key
        });
    }

    // activation_reset: https://woocommerce.com/document/software-add-on/#section-12
    async resetLicense(license_key: string): Promise<object> {
        return await this.getRequest("activation_reset", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
        });
    }

    // deactivation: https://woocommerce.com/document/software-add-on/#section-13
    async deactivateLicense(license_key: string, instance: string | null = null, activation_id: string | null = null): Promise<object> {
        return await this.getRequest("deactivation", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
            instance: instance,
            activation_id: activation_id,
        });
    }

    // check: https://woocommerce.com/document/software-add-on/#section-14
    async checkLicense(license_key: string): Promise<object> {
        return await this.getRequest("check", {
            email: this.email,
            license_key: license_key,
            product_id: this.product_id,
        });
    }

    private async getRequest(request: string, args: { [key: string]: string | null }): Promise<object> {
        let requestPath: string = "/woocommerce/?wc-api=software-api"
        requestPath += `&request=${request}`

        Object.keys(args).forEach(key => {
            if (args[key]) {
                requestPath += `&${key}=${args[key]}`
            }
        });

        return await new Promise<object>(resolve => {
            https.get({
                hostname: this.hostname,
                path: requestPath
            }, (res) => {

                if (res.statusCode != undefined && res.statusCode == 200) {
                    
                    let data: string = "";

                    // A chunk of data has been received.
                    res.on('data', (d) => {
                        data += d;
                    });

                    // The whole response has been received. Print out the result.
                    res.on('end', () => {

                        let json : {} = {};
                        
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
                        error: `Status code is ${res.statusCode}`
                    });

                }

            }).on('error', (e) => {

                resolve({
                    success: false,
                    error: e
                });

            });
        });

    }
}