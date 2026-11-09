export const MARKETPLACE_CONTRACT_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: 'ticketAddress', type: 'address', internalType: 'address' },
      { name: 'relayerAddress', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'listTicket',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      { name: 'seller', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelListing',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeResale',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      { name: 'buyer', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'listings',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address', internalType: 'address' },
      { name: 'price', type: 'uint96', internalType: 'uint96' },
      { name: 'active', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TicketListed',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint96', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingCancelled',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TicketResold',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'price', type: 'uint96', indexed: false },
    ],
  },
] as const;