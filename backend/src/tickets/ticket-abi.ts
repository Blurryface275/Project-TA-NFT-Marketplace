export const TICKET_CONTRACT_ABI = [
  {
    // Reference :
    // Ada di function mintTicket apda file TicketContract.sol
    // function mintTicket(address to, uint256 eventId, uint256 categoryId) external returns (uint256)
    type: 'function',
    name: 'mintTicket',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
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
