// src/modules/support/support.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./support.service";

export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    ApiResponse.created(
      res,
      await svc.createTicket(req.user!.id, req.body),
      "Ticket created",
    );
  },
);
export const getMyTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const { data, total } = await svc.getMyTickets(req.user!.id, skip, limit);
    ApiResponse.paginated(res, data, { page, limit, total });
  },
);
export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(
    res,
    await svc.getTicket(id, req.user!.id, req.user!.role),
  );
});
export const replyTicket = asyncHandler(async (req: Request, res: Response) => {
  const isStaff = ["ADMIN", "COACH", "RECEPTIONIST"].includes(req.user!.role);
  const id = req.params.id as string;
  ApiResponse.created(
    res,
    await svc.replyTicket(id, req.user!.id, req.body.message, isStaff),
    "Reply sent",
  );
});
export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(
    res,
    await svc.closeTicket(id, req.user!.id, req.user!.role),
    "Ticket closed",
  );
});
export const getAllTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const { data, total } = await svc.getAllTickets(
      skip,
      limit,
      req.query.status as string,
    );
    ApiResponse.paginated(res, data, { page, limit, total });
  },
);
export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    ApiResponse.success(
      res,
      await svc.updateStatus(
        id,
        req.body.status,
        req.body.assignedTo,
      ),
      "Status updated",
    );
  },
);
export const deleteTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await svc.deleteTicket(id);
    ApiResponse.noContent(res);
  },
);
