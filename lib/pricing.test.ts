import{describe,it,expect}from"vitest";import{estimatePrintPrice}from"./pricing";
const rules={active:true,rateBwA4Mmk:100,rateColorA4Mmk:500,a3MultiplierBps:20000,duplexDiscountBps:1000,stapleMmk:50,spiralMmk:400,minimumChargeMmk:300};
describe("print quote math (amounts are MMK whole kyat)",()=>{
 it("never invents a price when the rules or page count are unknown",()=>{expect(estimatePrintPrice({pages:null,copies:1,printMode:"BW",paperSize:"A4",duplex:false,finishing:"None"},rules)).toEqual({status:"QUOTE_REQUIRED",totalMmk:null});expect(estimatePrintPrice({pages:10,copies:1,printMode:"BW",paperSize:"A4",duplex:false,finishing:"None"},{...rules,active:false})).toEqual({status:"QUOTE_REQUIRED",totalMmk:null})});
 it("applies paper multiplier, duplex setting, finishing and minimum using integer arithmetic",()=>{expect(estimatePrintPrice({pages:10,copies:2,printMode:"BW",paperSize:"A3",duplex:true,finishing:"Staple"},rules)).toEqual({status:"ESTIMATE",totalMmk:3700})});
 it("enforces the configured minimum total",()=>{expect(estimatePrintPrice({pages:1,copies:1,printMode:"BW",paperSize:"A4",duplex:false,finishing:"None"},rules)).toEqual({status:"ESTIMATE",totalMmk:300})});
 it("requires an enabled rate for the selected print mode",()=>{expect(estimatePrintPrice({pages:4,copies:1,printMode:"COLOR",paperSize:"A4",duplex:false,finishing:"None"},{...rules,rateColorA4Mmk:null})).toEqual({status:"QUOTE_REQUIRED",totalMmk:null})});
});
