// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TicketContract is ERC721, Ownable, EIP712 {
    // Custom Error -> untuk menunjukkan pesan error jika kondis error terpenuhi
    error EventAlreadyExists(uint256 eventId); // error jika event yang sama sudah pernah dibuat
    error EventNotFound(uint256 eventId); // error jika event tidak ditemukan
    error CategoryAlreadyExist(uint256 eventId, uint256 categoryId); // error jika kateogrinya sudah ada duluan
    error EventAlreadyPassed(); // waktu pelaksanaann event udah lewat
    error EmptyIssuerWalletAddress(); // error jika alamat penyelenggara kosong
    error ForbiddenZero(); // nilai 0 yang tidak diijinkan untuk semua variabel
    error NotAuthorized(); // error jika yang memanggil fungsi bukan owner atau organizer

    error CategoryNotFound(uint256 eventId, uint256 categoryId);
    error SalesClosed();
    error QuotaExceeded();
    error MaxPerWalletExceeded();
    error TicketNotFound(uint256 tokenId);
    error TicketAlreadyUsed(uint256 tokenId);
    error InvalidSignature();
    error NonceAlreadyUsed(uint256 nonce);
    error SystemSignerNotSet();
    error TransferNotAllowed(); // transfer  token di luar MarketplaceContract
    error SalesNotStarted(uint64 saleStartTime); // flsh sale blm dibuka
    error InvalidSaleStartTime(); // jam buka >= jam event alias salah setup waktu start flash sale

    // Struct
    // struct itu seperti class untuk mendefinisikan sebuah object, ebdanya dengan class adalah tidak bisa memiliki fungsi / perilaku di dalamnya dan hanya pasif sebagai wadah
    struct EventInfo {
        bool exists;
        address organizer;
        uint64 eventTimestamp;
        uint32 maxPerWallet;
        bool salesOpen;
        uint64 saleStartTime; // 0 = langsung dibuka, >0 = flash sale dibuka sudah berapa deitk dari titik ini
    }

    struct TicketCategory {
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
    bytes32 public constant MINT_TYPEHASH =
        keccak256(
            "MintAuth(address to,uint256 eventId,uint256 categoryId,uint256 nonce)"
        );
    mapping(uint256 => TicketInfo) private _tickets; // mapping untuk menyimpan data ticket berdasarkan tokenid
    mapping(address => bytes32) private userIdentities; // data hash KYC KTP (wallet siap, milik identity hash yang mana)
    mapping(uint256 => bool) private usedNonces; // mekanisme anti replay attack signature, jadi nandain kalau nonce ini sudah eprnah dipakai
    mapping(uint256 => EventInfo) private events;
    mapping(uint256 => mapping(uint256 => TicketCategory)) private categories;
    mapping(uint256 => mapping(address => uint32)) private walletPurchases;

    // Event
    // event digunakan untuk menuliskan log langsung ke dalam blockchain
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        uint64 eventTimestamp,
        uint32 maxPerWallet
    );
    event CategoryCreated(
        uint256 indexed eventId,
        uint256 indexed categoryId,
        uint96 price,
        uint32 quota
    );
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint256 categoryId,
        address indexed buyer,
        uint96 price
    );
    event TicketUsed(
        uint256 indexed tokenId,
        address indexed scanner,
        uint64 timestamp
    );
    event SaleStartTimeSet(uint256 indexed eventId, uint64 saleStartTime);

    // Constructor
    // constructor akan berisi apa nama dari token ERC 721 (NFT) yang dibuat
    constructor()
        ERC721("NFTix", "NFTIX")
        Ownable(msg.sender)
        EIP712("NFTix", "1")
    {}

    function createEvent(
        uint256 eventId,
        address organizer,
        uint64 eventTimestamp,
        uint32 maxPerWallet
    ) external onlyOwner {
        if (eventId == 0) {
            // jika tidak ada event id maka revert
            revert ForbiddenZero();
        }
        if (organizer == address(0)) {
            // jika tidak ada organizer maka revert
            revert EmptyIssuerWalletAddress();
        }
        if (eventTimestamp <= block.timestamp) {
            // kalau tanggal event lebih awal daripada pembuatan tiket maka revert
            revert EventAlreadyPassed();
        }
        if (maxPerWallet == 0) {
            // jika jumlah maksimal pembelian tiket per wallet adalah 0, amka revert
            revert ForbiddenZero();
        }
        if (events[eventId].exists) {
            revert EventAlreadyExists(eventId);
        }

        // masukkan nilai ke EventInfo
        events[eventId] = EventInfo({
            exists: true,
            organizer: organizer,
            eventTimestamp: eventTimestamp,
            maxPerWallet: maxPerWallet,
            salesOpen: true,
            saleStartTime: 0
        });

        // emit log event
        emit EventCreated(eventId, organizer, eventTimestamp, maxPerWallet);
    }

    function addCategory(
        uint256 eventId,
        uint256 categoryId,
        uint96 price,
        uint32 quota
    ) external onlyOwner {
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
        if (!events[eventId].exists) {
            revert EventNotFound(eventId);
        }
        // hanya organizer yang boleh membuka penjualan
        if (msg.sender != events[eventId].organizer && msg.sender != owner()) {
            revert NotAuthorized();
        }
        events[eventId].salesOpen = open; // modify salesOpen
    }
    function setSaleStartTime(uint256 eventId, uint64 startTime) external {
        EventInfo storage ev = events[eventId];
        if (!ev.exists) revert EventNotFound(eventId);
        if (msg.sender != ev.organizer && msg.sender != owner())
            revert NotAuthorized();
        if (startTime >= ev.eventTimestamp) revert InvalidSaleStartTime();

        ev.saleStartTime = startTime;
        emit SaleStartTimeSet(eventId, startTime);
    }

    function setMarketplace(address _marketplace) public onlyOwner {
        if (_marketplace == address(0)) {
            revert ForbiddenZero();
        }
        // mengubah alamat marketplace
        marketplaceAddress = _marketplace;
    }
    function setSystemSigner(address _signer) public onlyOwner {
        if (_signer == address(0)) {
            revert ForbiddenZero();
        }

        // mengubah sistem signer menjadi signer yg benar
        systemSigner = _signer;
    }

    function mintTicket(
        address to,
        uint256 eventId,
        uint256 categoryId,
        uint256 nonce,
        bytes calldata signature
    ) external returns (uint256) {
        // Guard Input Dasar & systemSigner
        if (to == address(0)) revert ForbiddenZero();
        if (systemSigner == address(0)) revert SystemSignerNotSet();

        // prevent Replay Attack dengan mengecek nocne udh dipake apa blom
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce);

        // Rekonstruksi EIP-712 StructHash & Digest
        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, to, eventId, categoryId, nonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // VerifikasiSignature On-Chain
        address signer = ECDSA.recover(digest, signature);
        if (signer != systemSigner) revert InvalidSignature();

        // Kunci nonce secara on-chain (bisa dipakai 1 kali) supaya nonce inig abisa dipake lagi
        usedNonces[nonce] = true;

        // Validasi status acara dan kategori
        if (!events[eventId].exists) revert EventNotFound(eventId);
        if (!events[eventId].salesOpen) revert SalesClosed();
        if (block.timestamp < events[eventId].saleStartTime)
            revert SalesNotStarted(events[eventId].saleStartTime);
        if (!categories[eventId][categoryId].exists)
            revert CategoryNotFound(eventId, categoryId);
        TicketCategory storage cat = categories[eventId][categoryId];
        if (cat.minted >= cat.quota) revert QuotaExceeded();
        if (walletPurchases[eventId][to] >= events[eventId].maxPerWallet)
            revert MaxPerWalletExceeded();

        // Mutasi kuota dan hitung tokenId baru
        cat.minted++;
        walletPurchases[eventId][to]++;
        uint256 tokenId = ++_nextTokenId;

        // Kunci metadata tiket ke on-chain
        _tickets[tokenId] = TicketInfo({
            eventId: eventId,
            categoryId: categoryId,
            originalPrice: cat.price,
            used: false
        });

        // cetak NFT ke wallet penerima
        _safeMint(to, tokenId);

        // Tulsikan event lgo ek blockchain
        emit TicketMinted(tokenId, eventId, categoryId, to, cat.price);

        // kembalikan ID token yang baru dibuat
        return tokenId;
    }

    // helper untuk memeriksa apakah nonce tertentu sudah pernah digunakan
    function isNonceUsed(uint256 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }

    function markUsed(uint256 tokenId) external {
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) {
            // cek apakah tokenId valid
            revert TicketNotFound(tokenId);
        }
        if (_tickets[tokenId].used) {
            revert TicketAlreadyUsed(tokenId);
        }

        // hanya pemilik tiekt, organizer dan system signer yang boleh redeem ticket (update status markUsed)
        uint256 eventId = _tickets[tokenId].eventId;
        if (
            msg.sender != tokenOwner &&
            msg.sender != events[eventId].organizer &&
            msg.sender != owner()
        ) {
            revert NotAuthorized();
        }
        _tickets[tokenId].used = true; // update status menjadi sudah dipakai
        emit TicketUsed(tokenId, msg.sender, uint64(block.timestamp)); // emit = mengirimkan tulisan bahwa tiket sudha diredeem
    }

    // membaca halaman "My Ticket" dan "Verify Ticket"
    function getTicket(
        uint256 tokenId
    ) external view returns (TicketInfo memory) {
        if (_ownerOf(tokenId) == address(0)) revert TicketNotFound(tokenId);
        return _tickets[tokenId];
    }

    // function ini nantinya akan dibaca oleh MarketplaceContract untuk cek tanggal event
    function getEvent(
        uint256 eventId
    ) external view returns (EventInfo memory) {
        if (!events[eventId].exists) revert EventNotFound(eventId);
        return events[eventId];
    }

    function getWalletPurchases(
        uint256 eventId,
        address wallet
    ) external view returns (uint32) {
        return walletPurchases[eventId][wallet];
    }

    // marketplace = operator otomatis -> marketplace jadi pihak yg punya otortias tertinggi dalam kontrol NFT
    function isApprovedForAll(
        address tokenOwner,
        address operator
    ) public view override returns (bool) {
        if (
            marketplaceAddress != address(0) && operator == marketplaceAddress
        ) {
            return true;
        }
        return super.isApprovedForAll(tokenOwner, operator);
    }

    // seluruh perpindahan token (mint, transfer, burn) akan dilewatkan function ini
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // mint dan burn tidak dibatasi di sini
        if (from != address(0) && to != address(0)) {
            if (msg.sender != marketplaceAddress) revert TransferNotAllowed();

            TicketInfo storage t = _tickets[tokenId];
            if (t.used) revert TicketAlreadyUsed(tokenId);

            // resale dihitung ke batas tiket yang dipegang per wallet
            uint256 eventId = t.eventId;
            if (walletPurchases[eventId][to] >= events[eventId].maxPerWallet)
                revert MaxPerWalletExceeded();
            walletPurchases[eventId][from]--;
            walletPurchases[eventId][to]++;
        }

        return super._update(to, tokenId, auth);
    }
}
