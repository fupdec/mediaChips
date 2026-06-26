const os = require('os')

function getBestLocalIp() {
  const interfaces = os.networkInterfaces()
  const preferredOrder = [
    'en0', 'eth0', 'wlan0',
    'en1', 'en2', 'en3',
    'bridge100', 'bridge0',
  ]

  const ipPriority = [
    '192.168.',
    '10.',
    '172.16.',
    '169.254.',
  ]

  const allIps = []
  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIps.push({
          address: iface.address,
          interface: name,
          mac: iface.mac,
          isLinkLocal: iface.address.startsWith('169.254.'),
        })
      }
    }
  }

  for (const ifaceName of preferredOrder) {
    const interfaceIp = allIps.find(ip => ip.interface === ifaceName && !ip.isLinkLocal)
    if (interfaceIp) {
      console.log(`Selected IP ${interfaceIp.address} by interface priority ${ifaceName}`)
      return interfaceIp.address
    }
  }

  const nonLinkLocalIps = allIps.filter(ip => !ip.isLinkLocal)
  for (const prefix of ipPriority) {
    const matchingIp = nonLinkLocalIps.find(ip => ip.address.startsWith(prefix))
    if (matchingIp) {
      console.log(`Selected IP ${matchingIp.address} by prefix ${prefix}`)
      return matchingIp.address
    }
  }

  if (nonLinkLocalIps.length > 0) {
    console.log(`Selected first non-link-local IP: ${nonLinkLocalIps[0].address}`)
    return nonLinkLocalIps[0].address
  }

  if (allIps.length > 0) {
    console.log(`All IPs are link-local, selected: ${allIps[0].address}`)
    return allIps[0].address
  }

  console.log('No IP found, using localhost')
  return '127.0.0.1'
}

function getAllIps() {
  const interfaces = os.networkInterfaces()
  const ips = []

  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          address: iface.address,
          interface: name,
          mac: iface.mac,
          netmask: iface.netmask,
          cidr: iface.cidr,
        })
      }
    }
  }

  return ips
}

module.exports = {
  getBestLocalIp,
  getAllIps,
}
