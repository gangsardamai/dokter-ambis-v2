import type { ActionResult } from "@/types/action-result";

export function success(

  message: string

): ActionResult {

  return {

    success: true,

    message,

  };

}

export function failure(

  message: string

): ActionResult {

  return {

    success: false,

    message,

  };

}