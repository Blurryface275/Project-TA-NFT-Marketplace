export const TICKET_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'createEvent',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'organizer', type: 'address' },
      { name: 'eventTimestamp', type: 'uint64' },
      { name: 'maxPerWallet', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addCategory',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
      { name: 'price', type: 'uint96' },
      { name: 'quota', type: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    // Reference :
    // Ada di function mintTicket pada file TicketContract.sol
    // function mintTicket(address to, uint256 eventId, uint256 categoryId, uint256 nonce, bytes calldata signature) external returns (uint256)
    type: 'function',
    name: 'mintTicket',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }], // dari returns (uint256)
    stateMutability: 'nonpayable', // nonpayable artinya function ini tdk menerima ETH
  },
  {
    type: 'function',
    name: 'markUsed',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getTicket',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple', // type tuple karena multiple return (return object)
        components: [
          { name: 'eventId', type: 'uint256' },
          { name: 'categoryId', type: 'uint256' },
          { name: 'originalPrice', type: 'uint96' },
          { name: 'used', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TicketMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'eventId', type: 'uint256', indexed: true },
      { name: 'categoryId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: false },
      { name: 'price', type: 'uint96' },
    ],
  },
] as const;
