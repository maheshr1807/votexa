const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

async function fixConnectionString() {
  console.log("🔍 Bypassing local DNS to find your exact cluster details...");
  try {
    // Force Google DNS to bypass ISP block on SRV records
    const dnsPromises = require('dns').promises;
    dnsPromises.setServers(['8.8.8.8', '8.8.4.4']);

    const srvRecord = '_mongodb._tcp.cluster0.l0z0aku.mongodb.net';
    const txtRecord = 'cluster0.l0z0aku.mongodb.net';

    // 1. Get the replica set name from the TXT record
    console.log("Fetching TXT records...");
    const txt = await dnsPromises.resolveTxt(txtRecord);
    const txtString = txt.flat().join('');
    console.log("TXT Record found:", txtString);

    // Extract replica set name (e.g., authSource=admin&replicaSet=atlas-h2k93b-shard-0)
    const replicaSetMatch = txtString.match(/replicaSet=([^&]+)/);
    if (!replicaSetMatch) {
      throw new Error("Could not find replica set name in TXT record.");
    }
    const replicaSet = replicaSetMatch[1];
    console.log("✅ Found exact Replica Set Name:", replicaSet);

    // 2. Get the server nodes from the SRV record
    console.log("Fetching SRV records...");
    const srv = await dnsPromises.resolveSrv(srvRecord);
    const nodes = srv.map(record => `${record.name}:${record.port}`).join(',');
    console.log("✅ Found exact Cluster Nodes:", nodes);

    // 3. Construct the perfect connection string
    const password = "YWD5FOKqPIgPOxKa";
    const newUri = `mongodb://mr0586099_db_user:${password}@${nodes}/?ssl=true&replicaSet=${replicaSet}&authSource=admin&retryWrites=true&w=majority`;

    // 4. Update the .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the MONGODB_URI line
    envContent = envContent.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI="${newUri}"`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("\n🎉 SUCCESS! I have automatically updated your .env file with the correct string!");
    console.log("You can now run: node seeders/seed.js");

  } catch (err) {
    console.error("❌ Failed to resolve DNS:", err.message);
    console.log("If this failed, it means your network is blocking ALL custom DNS requests.");
  }
}

fixConnectionString();
