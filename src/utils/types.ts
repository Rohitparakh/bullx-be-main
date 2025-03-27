export interface ITokenMC {
  pumpCurvePrice?: number;
  marketCap?: number;
  liquidity?: number;
  bondingProgress?: number;
}

export interface IRange {
  min?: number;
  max?: number;
}

export interface IFilters {
  poolCreationBlockTimestamp?: number; 
  chainIds?: number[];
  mintAuthDisabled?: false;
  freezeAuthDisabled?: false;
  lpBurned?: false;
  topTenHolders?: false;
  social?: false;
  volume?: IRange | null;
  liquidity?: IRange | null | undefined;
  marketcap?: IRange | null | undefined;
  txns?: IRange | null | undefined;
  buys?: IRange | null | undefined;
  sells?: IRange | null | undefined;
 
}
