"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/* M29 — "Save as PDF" via the browser's print dialog. Zero PDF dependency;
 * the print CSS in globals.css cleans the page up. Hidden in the printout
 * itself via .print-hide.
 */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print-hide"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" /> Save as PDF
    </Button>
  );
}
