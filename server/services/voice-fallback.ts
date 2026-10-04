export interface VoiceResult {

 success:boolean;

 audioUrl?:string;

 provider?:string;

 error?:string;

}



export async function executeVoiceFallback(

 providers:Array<
 ()=>Promise<VoiceResult>
 >

):Promise<VoiceResult>{


 for(
  const provider of providers
 ){

  try{


   const result =
   await provider();


   if(result.success){

    return result;

   }


  }
  catch(error){

   continue;

  }


 }



 return {

  success:false,

  error:
  "VOICE_UNAVAILABLE"

 };


}