/**
 * One-time administrative bootstrap. For a NEW deployment with no user accounts.
 * Usage (Windows CMD, from backend/):
 *   set MEDILINK_BOOTSTRAP_USERNAME=youradmin
 *   set MEDILINK_BOOTSTRAP_PASSWORD=use-a-strong-unique-password
 *   node --env-file=.env scripts/bootstrap-admin.mjs
 *   set MEDILINK_BOOTSTRAP_PASSWORD=
 * Must not run on the synthetic QA database or any DB with existing user accounts.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const username=(process.env.MEDILINK_BOOTSTRAP_USERNAME||'').trim();
const password=process.env.MEDILINK_BOOTSTRAP_PASSWORD||'';
if(!/^[a-z0-9._-]{3,50}$/i.test(username) || password.length<14 || /^(.)\1+$/.test(password)){
  console.error('Set MEDILINK_BOOTSTRAP_USERNAME (3-50 characters) and MEDILINK_BOOTSTRAP_PASSWORD (14+ characters) first.');
  process.exit(1);
}
if(process.env.DEMO_MODE==='true'){
  console.error('Disable DEMO_MODE before bootstrapping operational administrator credentials.');process.exit(1);
}
const prisma=new PrismaClient();
try{
  const users=await prisma.userAccount.count();
  if(users!==0)throw new Error(`Refusing bootstrap: ${users} account(s) already exist. No database modifications made.`);
  const passwordHash=await bcrypt.hash(password,12);
  await prisma.$transaction(async tx=>{
    const staff=await tx.staff.create({data:{fullName:'System Administrator',role:'ADMIN'}});
    await tx.userAccount.create({data:{username,passwordHash,role:'ADMIN',staffId:staff.id}});
  });
  console.log('Administrator created. Sign in with the credentials you supplied.');
}catch(error){console.error('Bootstrap failed:',error.message);process.exitCode=1}
finally{await prisma.$disconnect()}
