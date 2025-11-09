export const successResponse = (res, data, message = 'Operación exitosa', meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.json(response);
};

export const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = (res, data, page, limit, total, message = 'Operación exitosa') => {
  const totalPages = Math.ceil(total / limit);

  return successResponse(res, data, message, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
  });
};

