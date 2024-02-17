// extend js default error class to make cutom error 
// this error will be send as error response
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somthing Went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode,
    this.message = message,
    this.data = null,
    this.success= false,
    this.errors = errors

    if (stack) {
        this.stack = stack
    } else{
        // trace the error (where it was called)
        Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}
