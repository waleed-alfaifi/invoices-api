import { prismaClient } from "@shared/index";
import {
  Invoice,
  Address,
  Client,
  InvoiceStatus,
  Item,
  PaymentTerms,
} from "prisma/prisma-client";

export { InvoiceStatus } from "prisma/prisma-client";
export const model = prismaClient.invoice;

export interface AddressAPI extends Omit<Address, "id" | "userId"> {}
export interface ClientAPI extends Omit<Client, "id" | "addressId"> {
  address: AddressAPI;
}

export interface ItemAPI extends Omit<Item, "invoiceId"> {}

export type Links = {
  rel: "self" | "item";
  href: string;
  action: "GET" | "POST" | "PUT" | "DELETE";
}[];

export interface SingleInvoice
  extends Partial<{
    id: string;
    date: number;
    description: string;
    payment: {
      key: PaymentTerms;
      text: string;
    };
    status: InvoiceStatus;
    address: AddressAPI;
    client: Partial<ClientAPI>;
    items?: Partial<Partial<ItemAPI>[]>;
    links?: Links;
  }> {}

export interface MultipleInvoices
  extends Array<
    Partial<{
      id: string;
      date: number;
      status: InvoiceStatus;
      payment: {
        key: PaymentTerms;
        text: string;
      };
      client: Pick<ClientAPI, "name">;
      items: ItemAPI[];
      links?: Links;
    }>
  > {}

export type RequestItem = Omit<Item, "id" | "invoiceId">;
export type RequestItems = RequestItem[];

/**
 * Represents the shape of client's request body
 */
export interface RequestInvoice {
  date: number;
  description: string;
  client: ClientAPI;
  address: AddressAPI;
  payment?: PaymentTerms;
  status?: InvoiceStatus;
  items?: RequestItems;
}

export interface UpdateInvoice extends Omit<RequestInvoice, "items"> {
  items?: (Partial<Pick<Item, "id">> & RequestItem)[];
}

type IMapOne = Partial<
  Invoice & {
    address: AddressAPI;
    client: Pick<Client, "name" | "email"> & {
      address: AddressAPI;
    };
    items: ItemAPI[];
  }
>;

type IMapMultiple = Partial<
  Invoice & {
    address: AddressAPI;
    client: Pick<Client, "name" | "email">;
    items: ItemAPI[];
  }
>;

export class InvoiceServiceMapper {
  private paymentTermsMap: Record<PaymentTerms, string> = {
    terms_1: "Net 1 Day",
    terms_7: "Net 7 Days",
    terms_14: "Net 14 Days",
    terms_30: "Net 30 Days",
  };

  mapOne(invoice: IMapOne, options?: { withLinks?: boolean }): SingleInvoice {
    const { withLinks = false } = options || {};

    const {
      id,
      description,
      date,
      status,
      payment_terms,
      items,
      address,
      client,
    } = invoice;

    const links: { links: Links } | undefined = withLinks
      ? {
          links: [
            {
              action: "GET",
              href: `/api/invoices/${id}`,
              rel: "self",
            },
          ],
        }
      : undefined;

    return {
      id,
      description,
      address,
      date: date?.getTime(),
      status,
      items,
      client: {
        name: client?.name,
        email: client?.email,
        address: client?.address,
      },
      payment: {
        key: payment_terms as PaymentTerms, // default by database
        text: this.paymentTermsMap[payment_terms as PaymentTerms],
      },
      ...links,
    };
  }

  mapMultiple(invoices: IMapMultiple[]): MultipleInvoices {
    return invoices.map(
      ({ id, date, status, client, items, payment_terms }) => ({
        id,
        date: date?.getTime(),
        status,
        client,
        items,
        payment: {
          key: payment_terms as PaymentTerms, // default by database
          text: this.paymentTermsMap[payment_terms as PaymentTerms],
        },
        links: [
          {
            rel: "self",
            href: `/api/invoices/${id}`,
            action: "GET",
          },
        ],
      })
    );
  }
}
