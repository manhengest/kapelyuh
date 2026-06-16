export type ProEntitlement = {
  isPro: false;
};

export function getProEntitlement(): ProEntitlement {
  return { isPro: false };
}
