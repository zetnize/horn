import { z } from "zod";
export async function temporarySubmit(request:Request,schema:z.ZodType) {
 let body:unknown;try{body=await request.json();}catch{return Response.json({ok:false,message:"Некорректный запрос"},{status:400});}
 const result=schema.safeParse(body);
 if(!result.success)return Response.json({ok:false,message:"Проверьте поля формы",errors:z.flattenError(result.error).fieldErrors},{status:400});
 return Response.json({ok:true});
}

