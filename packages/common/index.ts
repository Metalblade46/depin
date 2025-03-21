export type SignUpRequest = {
    callbackId: string;
    publicKey: string;
    signature: string
}
export type SignupResponse = {
    callbackId: string;
    validatorId: string
}
export type ValidateRequest = {
    callbackId: string;
    url: string
}
export type ValidateResponse = {
    callbackId: string;
    status: 'Up' | 'Down';
    latency: number;
    publicKey: string;
    signature: string
}
export type ValidationSuccessResponse = {
    callbackId: string
}
export type ServerErrorResponse = ValidationSuccessResponse


// Hub Incoming
export type HubIncoming = { messageType: 'ping' }
    | {
        messageType: 'signup'
        data: SignUpRequest
    } | {
        messageType: 'validate',
        data: ValidateResponse
    }

//Hub Outgoing
export type HubOutgoing = { messageType: 'pong' }
    | { messageType: 'invalid signature' }
    | {
        messageType: 'signup'
        data: SignupResponse
    } | {
        messageType: 'validate',
        data: ValidateRequest
    }
    | {
        messageType: 'validation success',
        data: ValidationSuccessResponse
    }
    | {
        messageType: 'server error',
        data: ServerErrorResponse
    }


//Validator Incoming
export type ValidatorIncoming = HubOutgoing

//Validator Outgoing
export type ValidatorOutgoing = HubIncoming

export type WithdrawalRequest = {
    amount: number;
    signature: string;
    publicKey: string;
}
export type LockingTask={
    validatorId: string;
    requestedAmount: number;
}
export type ProcessingTask={
    validatorId: string;
}
export type UnlockingTask={
    validatorId: string;
    txnSignature?: string;
    retryCount: number;
}