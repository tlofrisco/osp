import { GraphQLClient, gql } from 'graphql-request';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// load env
const envPath=[path.join(process.cwd(),'..','.env'),path.join(process.cwd(),'.env')].find(p=>fs.existsSync(p));
if(envPath)dotenv.config({path:envPath});

const client=new GraphQLClient('https://backboard.railway.app/graphql/v2',{headers:{authorization:`Bearer ${process.env.RAILWAY_TOKEN}`}});

const query=gql`{
  __schema {
    mutationType {
      fields {
        name
        args {
          name
          type { name kind ofType { name kind } }
        }
      }
    }
  }
}`;

const run=async()=>{
  const data=await client.request(query);
  const field=data.__schema.mutationType.fields.find(f=>f.name==='serviceUpdate');
  console.log(JSON.stringify(field,null,2));
};
run().catch(console.error); 