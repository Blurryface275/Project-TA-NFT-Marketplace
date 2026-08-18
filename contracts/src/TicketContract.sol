// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.36;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TicketContract is ERC721, Ownable{    

    // Custom Error -> untuk menunjukkan pesan error jika kondis error terpenuhi
    error EventAlreadyExists(uint256 eventId); // error jika event yang sama sudah pernah dibuat
    error EventNotFound(uint256 eventId); // error jika event tidak ditemukan
    error CategoryAlreadyExist(uint256 eventId, uint256 categoryId); // error jika kateogrinya sudah ada duluan
    error EventAlreadyPassed(); // waktu pelaksanaann event udah lewat
    error EmptyIssuerWalletAddress(); // error jika alamat penyelenggara kosong
    error ForbiddenZero(); // nilai 0 yang tidak diijinkan untuk semua variabel
    

    // Struct 
    // struct itu seperti class untuk mendefinisikan sebuah object, ebdanya dengan class adalah tidak bisa memiliki fungsi / perilaku di dalamnya dan hanya pasif sebagai wadah
    struct EventInfo{
        bool exists;
        address organizer;
        uint64 eventTimestamp;
        uint32 maxPerWallet;
        bool salesOpen;
    }

    struct TicketCategory{
        bool exists;
        uint96 price;
        uint32 quota;
        uint32 minted; // atau sold alias jumlah terjual
    }

    mapping(uint256 => EventInfo) private events;
    mapping(uint256 => mapping(uint256 => TicketCategory)) private categories;

    // Event
    // event digunakan untuk menuliskan log langsung ke dalam blockchain
    event EventCreated(uint256 indexed eventId, address indexed organizer, uint64 eventTimestamp, uint32 maxPerWallet);
    event CategoryCreated(uint256 indexed eventId, uint256 indexed categoryId, uint96 price, uint32 quota);

    // Constructor
    // constructor akan berisi apa nama dari token ERC 721 (NFT) yang dibuat
    constructor() ERC721("NFTix", "NFTIX") Ownable(msg.sender) {
        
    }

    function createEvent(uint256 eventId,
        address organizer,
        uint64  eventTimestamp,
        uint32  maxPerWallet) external onlyOwner{
        
    }

    function addCategory( uint256 eventId,
    uint256 categoryId,
    uint96  price,
    uint32  quota) external onlyOwner{

    }




    
}