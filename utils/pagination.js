const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Reads ?page and ?limit from a query string, clamped to sane bounds.
exports.parsePagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

exports.paginate = async (model, filter, { page, limit, skip }, sort = { createdAt: -1 }) => {
  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit),
    model.countDocuments(filter),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
};
