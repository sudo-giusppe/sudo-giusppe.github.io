export class AdminError extends Error {
	constructor(status, message, details = {}) {
		super(message);
		this.name = "AdminError";
		this.status = status;
		this.details = details;
	}
}
