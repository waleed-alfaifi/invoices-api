import { User } from "prisma/prisma-client";
import { model, InvoiceServiceMapper, UpdateInvoice } from "./interface";
import type {
  RequestInvoice,
  SingleInvoice,
  MultipleInvoices,
} from "./interface";
import { prismaClient } from "@shared/index";

class InvoiceServiceClass {
  private mapper = new InvoiceServiceMapper();

  async getInvoice(id: string): Promise<SingleInvoice | null> {
    const storedInvoice = await model.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        address: {
          select: {
            street: true,
            city: true,
            country: true,
            post_code: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
            address: {
              select: {
                street: true,
                city: true,
                country: true,
                post_code: true,
              },
            },
          },
        },
      },
    });

    if (storedInvoice) {
      return this.mapper.mapOne(storedInvoice);
    }

    return null;
  }

  async getAllInvoices(
    owner: Pick<User, "id" | "username">
  ): Promise<MultipleInvoices> {
    const invoices = await model.findMany({
      where: {
        userId: owner.id,
        isDeleted: false,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    return this.mapper.mapMultiple(invoices);
  }

  async addInvoice(
    invoice: RequestInvoice,
    owner: Pick<User, "id" | "username">
  ): Promise<SingleInvoice> {
    const {
      date,
      description,
      payment,
      status,
      client,
      address: issuerAddress,
      items,
    } = invoice;
    const { name, email, address } = client;

    const createdInvoice = await model.create({
      data: {
        user: {
          connect: {
            id: owner.id,
          },
        },
        date: new Date(date),
        description,
        payment_terms: payment,
        status,
        client: {
          create: {
            name,
            email,
            address: {
              create: address,
            },
          },
        },
        address: {
          create: issuerAddress,
        },
        items: {
          create: items,
        },
      },
      include: {
        address: {
          select: {
            street: true,
            city: true,
            country: true,
            post_code: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
            address: {
              select: {
                street: true,
                city: true,
                country: true,
                post_code: true,
              },
            },
          },
        },
      },
    });

    return this.mapper.mapOne(createdInvoice, {
      withLinks: true,
    });
  }

  async deleteInvoice(id: string) {
    const invoice = await model.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    return invoice.isDeleted;
  }

  async updateInvoice(data: { id: string } & Partial<UpdateInvoice>) {
    const { id, description, date, status, payment, address, client, items } =
      data;

    const storedItems = await prismaClient.item.findMany({
      where: {
        invoiceId: id,
      },
    });

    // Case 1: client sends empty array -- delete stored items if they exist
    if (storedItems.length > 0 && items && items.length === 0) {
      await prismaClient.item.deleteMany({
        where: {
          invoiceId: id,
        },
      });
    }
    // Case 2: client sends a non-empty array -- update existing items and create the non existing
    else if (items && items.length > 0) {
      const deletedItems = storedItems
        .filter((s) => !items.find((i) => i.id === s.id))
        .map((d) => d.id);

      // Case 3: client did not include some stored items in the sent array - delete them
      if (deletedItems.length > 0) {
        await prismaClient.item.deleteMany({
          where: {
            invoiceId: id,
            id: {
              in: deletedItems,
            },
          },
        });
      }

      // Case 4: update/create the sent items
      for (const item of items) {
        const { id: itemId = -1, ...rest } = item;

        await prismaClient.item.upsert({
          create: {
            ...rest,
            invoiceId: id,
          },
          update: rest,
          where: {
            id: itemId,
          },
        });
      }
    }

    const updated = await model.update({
      where: {
        id,
      },
      data: {
        description,
        date: date ? new Date(date) : undefined,
        status,
        payment_terms: payment,
        address: {
          update: address,
        },
        client: {
          update: {
            ...client,
            address: {
              update: client?.address,
            },
          },
        },
      },
      include: {
        address: {
          select: {
            street: true,
            city: true,
            country: true,
            post_code: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
            address: {
              select: {
                street: true,
                city: true,
                country: true,
                post_code: true,
              },
            },
          },
        },
      },
    });

    return this.mapper.mapOne(updated);
  }
}

export const InvoiceService = () => new InvoiceServiceClass();
