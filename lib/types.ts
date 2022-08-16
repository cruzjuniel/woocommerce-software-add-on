import { IncomingHttpHeaders } from 'http';

export interface WooCommerceSoftwareResult {
    success: boolean,
    code: number | undefined,
    headers: IncomingHttpHeaders | null,
    output: object | string | null,
    error: unknown | string
}

export interface WooCommerceSoftwareActivations {
    activation_id: string,
    instance: string,
    activation_platform: string,
    activation_time: string
}

export interface WooCommerceSoftwareCheckResult {
    success: boolean,
    timestamp: number,
    sig: string,
}

export interface WooCommerceSoftwareCheckSuccess extends WooCommerceSoftwareCheckResult {
    remaining: number,
    activations: Array<WooCommerceSoftwareActivations>
}

export interface WooCommerceSoftwareCheckFailed extends WooCommerceSoftwareCheckResult {
    success: false,
    timestamp: number,
    sig: string,
    code: string,
    error: string
}
