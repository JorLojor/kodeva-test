export type Pagination = {
	currentPage: number;
	pageLimit: number;
	total: number;
	totalPages: number;
};

export type SuccessResponse<T> = {
	message: string;
	data?: T;
	pagination?: Pagination;
	description?: string;
};

export type ErrorResponse = {
	message: string;
	errors: string[];
};
