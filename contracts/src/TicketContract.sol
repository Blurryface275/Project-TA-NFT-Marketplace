// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

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
    error NotAuthorized(); // error jika yang memanggil fungsi bukan owner atau organizer
    

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

    struct TicketInfo {
        uint256 eventId;
        uint256 categoryId;
        uint96 originalPrice; // dikunci permanen saat minting, jadi calo tidak bisa markup harga nantinya
        bool used; // status check i di lokasi acara
    }

    address public marketplaceAddress; // alamat kontrak marketplace resmi
    address public systemSigner; // address signer backend yang merilis signature
    uint256 private _nextTokenId; // penghitung ID token NFT
    mapping(uint256 => TicketInfo) private _tickets; // mapping untuk menyimpan data ticket berdasarkan tokenid
    mapping(address => bytes32) private userIdentities; // data hash KYC KTP (wallet siap, milik identity hash yang mana)
    mapping(uint256 => bool) private usedNonces; // mekanisme anti replay attack signature, jadi nandain kalau nonce ini sudah eprnah dipakai   
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
        if(eventId==0){ // jika tidak ada event id maka revert
            revert ForbiddenZero();
        }
        if(organizer==address(0)){ // jika tidak ada organizer maka revert
            revert EmptyIssuerWalletAddress();
        }
        if(eventTimestamp<=block.timestamp){ // kalau tanggal event lebih awal daripada pembuatan tiket maka revert
            revert EventAlreadyPassed();
        }
        if(maxPerWallet==0){ // jika jumlah maksimal pembelian tiket per wallet adalah 0, amka revert
            revert ForbiddenZero();
        }
        if (events[eventId].exists){
            revert EventAlreadyExists(eventId);
        }

        // masukkan nilai ke EventInfo
        events[eventId] = EventInfo({
            exists: true,
            organizer: organizer,
            eventTimestamp: eventTimestamp,
            maxPerWallet: maxPerWallet,
            salesOpen: true
        });

        // emit log event
        emit EventCreated(eventId, organizer, eventTimestamp, maxPerWallet);

        
    }

    function addCategory( uint256 eventId,
    uint256 categoryId,
    uint96  price,
    uint32  quota) external onlyOwner{
        if (!events[eventId].exists) {
            revert EventNotFound(eventId);
        }
        if (categoryId == 0 || quota == 0 || price == 0) {
            revert ForbiddenZero();
        }
        if (categories[eventId][categoryId].exists) {
            revert CategoryAlreadyExist(eventId, categoryId);
        }

        // masukkan nilai ke Category
        categories[eventId][categoryId] = TicketCategory({
            exists: true,
            price: price,
            quota: quota,
            minted: 0
        });

        // emit log event untuk category
        emit CategoryCreated(eventId, categoryId, price, quota);

    }

    function setSalesOpen(uint256 eventId, bool open) external {
        if(!events[eventId].exists){
            revert EventNotFound(eventId);
        }
        // hanya organizer yang boleh membuka penjualan
        if(msg.sender != events[eventId].organizer && msg.sender != owner()){
            revert NotAuthorized();
        }
        events[eventId].salesOpen = open; // modify salesOpen
    }

    function setMarketplace(address _marketplace) public onlyOwner{
        if (_marketplace == address(0)){
            revert ForbiddenZero();
        }
        // mengubah alamat marketplace
        marketplaceAddress = _marketplace;
    }
    function setSystemSigner(address _signer) public{
        // validasi awal
        if(msg.sender != owner()) {
            revert NotAuthorized();
        }
        if(_signer == address(0)){
            revert ForbiddenZero();
        }

        // mengubah sistem signer menjadi signer yg benar
        systemSigner = _signer;
    }




    
}