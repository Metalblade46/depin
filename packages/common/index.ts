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
export type HubOutgoing = {messageType: 'pong'}
|{ messageType: 'Invalid Signature' }
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
export type ValidatorIncoming ={messageType: 'pong'} 
| { messageType: 'Invalid Signature' }
    | {
        messageType: 'signup'
        data: SignupResponse
    }
    | {
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

//Validator Outgoing
export type ValidatorOutgoing = { messageType: 'ping' }
    | {
        messageType: 'signup'
        data: SignUpRequest
    } | {
        messageType: 'validate',
        data: ValidateResponse
    }
