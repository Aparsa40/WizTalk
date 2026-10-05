export interface ResponseLog {
  
 characterId?: string;
  
 provider?: string;
  
 model?: string;
  
 success:boolean;
  
 latencyMs:number;
  
 errorType?:string;

}



export async function logResponse(
data:ResponseLog
){

 /*
  Production:
  Save to response_logs table

  Important:
  Never store:
  - API keys
  - passwords
  - private tokens
  - raw sensitive user data
 */


 console.info(
 "[ResponseLog]",
 {
   characterId:data.characterId,
   provider:data.provider,
   model:data.model,
   success:data.success,
   latencyMs:data.latencyMs,
   errorType:data.errorType
 }
 );


}
