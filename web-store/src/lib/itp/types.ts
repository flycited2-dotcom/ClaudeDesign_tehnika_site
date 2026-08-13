export type ItpRpcRequest = {
  request: {
    method: string;
    model: string;
    module: string;
  };
  session?: string;
  data?: unknown;
  filter?: Array<{
    property: string;
    operator?: "=" | "IN" | ">" | "<" | ">=" | "<=" | "!=";
    value?: unknown;
  }>;
  pager?: {
    limit: number;
    start: number;
  };
  sort?: Array<{
    direction: "ASC" | "DESC";
    property: string;
  }>;
};

export type ItpRpcResponse<T> = {
  success: boolean;
  message?: string;
  commandid?: number;
  event?: string;
  data?: T;
  session?: string;
};

export type ItpCategory = {
  id: number;
  leaf: boolean;
  name: string;
  childrens?: ItpCategory[];
};

export type ItpProduct = {
  barcodes?: string;
  category: number;
  name: string;
  part?: string;
  multiplicity?: number;
  sku: number;
  vendor?: string;
  volume?: number;
  has_image?: boolean;
  rrp?: number;
  warranty?: string;
  weight?: number;
};

export type ItpActiveProduct = {
  price: number;
  qty: "*" | "**" | "***" | "0" | string;
  real_qty?: number;
  nearest_logistic_center_qty?: "*" | "**" | "***" | "0" | string;
  nearest_logistic_center_real_qty?: number;
  sku: number;
  delivery_days?: number;
  multiplicity?: number;
  cost_delivery?: number;
};

export type ItpProductImage = {
  id: number;
  sku: number;
  url: string;
  deleted: boolean;
  priority: number;
};

export type ItpWarehouse = {
  id: number;
  name: string;
};

export type ItpAddress = {
  id: number;
  address: string;
};
