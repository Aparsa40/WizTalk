interface ProviderStatus {

  failures: number;

  lastFailure?: number;

  disabledUntil?: number;

}


const providers =
new Map<string, ProviderStatus>();



const FAILURE_THRESHOLD = 5;

const COOLDOWN_MS =
5 * 60 * 1000;



export function registerProviderFailure(
provider:string
){

 const current =
 providers.get(provider) ||
 {
   failures:0
 };


 current.failures++;

 current.lastFailure =
 Date.now();


 if(current.failures >= FAILURE_THRESHOLD){

   current.disabledUntil =
   Date.now() + COOLDOWN_MS;

 }


 providers.set(provider,current);

}



export function registerProviderSuccess(
provider:string
){

 providers.set(
 provider,
 {
   failures:0
 }
 );

}



export function isProviderAvailable(
provider:string
){

 const status =
 providers.get(provider);


 if(!status){
   return true;
 }


 if(
 status.disabledUntil &&
 status.disabledUntil > Date.now()
 ){

   return false;

 }


 return true;

}



export function getProviderStatus(
provider:string
){

 return (
 providers.get(provider)
 ??
 {
  failures:0
 }
 );

}