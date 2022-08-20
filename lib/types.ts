import { IncomingHttpHeaders } from 'http';

// API Generated Error
export interface WooCommerceSoftwareApiError {
    error: string | undefined,
    code: number | undefined
}

// Module Generated Result
export interface WooCommerceSoftwareResult {
    success: boolean,
    code: number | undefined,
    headers: IncomingHttpHeaders | null,
    output: object | string | null,
    error: unknown | string
}

export interface WooCommerceSoftwareCheckResult {
    success: boolean,
    timestamp: number,
    sig: string
}

export interface WooCommerceSoftwareActivations {
    activation_id: string,
    instance: string,
    activation_platform: string,
    activation_time: string
}

export interface WooCommerceSoftwareCheckSuccess extends WooCommerceSoftwareCheckResult {
    success: true,
    remaining: number,
    activations: Array<WooCommerceSoftwareActivations>
}

export interface WooCommerceSoftwareCheckFailed extends WooCommerceSoftwareCheckResult {
    success: false,
    code: string,
    error: string
}

export interface WooCommerceSoftwareActivateResult {
    activated: boolean,
    timestamp: number,
    sig: string
}

export interface WooCommerceSoftwareActivateSuccess extends WooCommerceSoftwareActivateResult {
    activated: true,
    instance: number,
    message: string
}

export interface WooCommerceSoftwareActivateFailed extends WooCommerceSoftwareActivateResult {
    activated: false,
    code: string,
    error: string
}

export interface WooCommerceSoftwareDeactivateResult {
    reset: boolean,
    timestamp: number,
    sig: string
}