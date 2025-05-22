// src/services/PaginationService.ts - Serviço de Paginação
export class PaginationService {
  public static getPaginationData(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
      startIndex: (page - 1) * limit + 1,
      endIndex: Math.min(page * limit, total)
    };
  }

  public static getPaginationLinks(baseUrl: string, page: number, totalPages: number) {
    const links: any = {
      self: `${baseUrl}?page=${page}`,
      first: `${baseUrl}?page=1`,
      last: `${baseUrl}?page=${totalPages}`
    };

    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}`;
    }

    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}`;
    }

    return links;
  }
}