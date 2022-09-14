// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IBNFTRegistry} from "../interfaces/IBNFTRegistry.sol";
import {IBNFT} from "../interfaces/IBNFT.sol";
import {BNFTUpgradeableProxy} from "../libraries/BNFTUpgradeableProxy.sol";

import {ITransfer} from "../interfaces/ITransfer.sol";
import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";

contract BNFTRegistry is IBNFTRegistry, Initializable, OwnableUpgradeable {
  mapping(address => address) public bNftProxys;
  mapping(address => address) public bNftImpls;
  address[] public bNftAssetLists;
  string public namePrefix;
  string public symbolPrefix;
  address public bNftGenericImpl;
  mapping(address => string) public customSymbols;
  uint256 private constant _NOT_ENTERED = 0;
  uint256 private constant _ENTERED = 1;
  uint256 private _status;
  address private _claimAdmin;
  // ERC721 interfaceID
  bytes4 public constant INTERFACE_ID_ERC721 = 0x80ac58cd;
  // ERC1155 interfaceID
  bytes4 public constant INTERFACE_ID_ERC1155 = 0xd9b67a26;
  // Address of the transfer contract for ERC721 tokens
  address public TRANSFER_ERC721;
  // Address of the transfer contract for ERC1155 tokens
  address public TRANSFER_ERC1155;
  // Map collection address to transfer address
  mapping(address => address) public transfers;

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and making it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    // On the first call to nonReentrant, _notEntered will be true
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;

    _;

    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }

  /**
   * @dev Throws if called by any account other than the claim admin.
   */
  modifier onlyClaimAdmin() {
    require(claimAdmin() == _msgSender(), "BNFTR: caller is not the claim admin");
    _;
  }

  function getBNFTAddresses(address nftAsset) external view override returns (address bNftProxy, address bNftImpl) {
    bNftProxy = bNftProxys[nftAsset];
    bNftImpl = bNftImpls[nftAsset];
  }

  function getBNFTAddressesByIndex(uint16 index) external view override returns (address bNftProxy, address bNftImpl) {
    require(index < bNftAssetLists.length, "BNFTR: invalid index");
    bNftProxy = bNftProxys[bNftAssetLists[index]];
    bNftImpl = bNftImpls[bNftAssetLists[index]];
  }

  function getBNFTAssetList() external view override returns (address[] memory) {
    return bNftAssetLists;
  }

  function allBNFTAssetLength() external view override returns (uint256) {
    return bNftAssetLists.length;
  }

  function initialize(
    address genericImpl,
    string memory namePrefix_,
    string memory symbolPrefix_
  ) external override initializer {
    require(genericImpl != address(0), "BNFTR: impl is zero address");

    __Ownable_init();

    bNftGenericImpl = genericImpl;

    namePrefix = namePrefix_;
    symbolPrefix = symbolPrefix_;

    _setClaimAdmin(_msgSender());

    emit Initialized(genericImpl, namePrefix, symbolPrefix);
  }

  /**
   * @dev See {IBNFTRegistry-createBNFT}.
   */
  function createBNFT(address nftAsset) external override nonReentrant returns (address bNftProxy) {
    _requireAddressIsERC721(nftAsset);
    require(bNftProxys[nftAsset] == address(0), "BNFTR: asset exist");
    require(bNftGenericImpl != address(0), "BNFTR: impl is zero address");

    bNftProxy = _createProxyAndInitWithImpl(nftAsset, bNftGenericImpl);

    emit BNFTCreated(nftAsset, bNftImpls[nftAsset], bNftProxy, bNftAssetLists.length);
  }

  /**
   * @dev See {IBNFTRegistry-setBNFTGenericImpl}.
   */
  function setBNFTGenericImpl(address genericImpl) external override nonReentrant onlyOwner {
    require(genericImpl != address(0), "BNFTR: impl is zero address");
    bNftGenericImpl = genericImpl;

    emit GenericImplementationUpdated(genericImpl);
  }

  /**
   * @dev See {IBNFTRegistry-createBNFTWithImpl}.
   */
  function createBNFTWithImpl(address nftAsset, address bNftImpl)
    external
    override
    nonReentrant
    onlyOwner
    returns (address bNftProxy)
  {
    _requireAddressIsERC721(nftAsset);
    require(bNftImpl != address(0), "BNFTR: implement is zero address");
    require(bNftProxys[nftAsset] == address(0), "BNFTR: asset exist");

    bNftProxy = _createProxyAndInitWithImpl(nftAsset, bNftImpl);

    emit BNFTCreated(nftAsset, bNftImpls[nftAsset], bNftProxy, bNftAssetLists.length);
  }

  /**
   * @dev See {IBNFTRegistry-upgradeBNFTWithImpl}.
   */
  function upgradeBNFTWithImpl(
    address nftAsset,
    address bNftImpl,
    bytes memory encodedCallData
  ) external override nonReentrant onlyOwner {
    _upgradeBNFTWithImpl(nftAsset, bNftImpl, encodedCallData);
  }

  function _upgradeBNFTWithImpl(
    address nftAsset,
    address bNftImpl,
    bytes memory encodedCallData
  ) internal {
    address bNftProxy = bNftProxys[nftAsset];
    require(bNftProxy != address(0), "BNFTR: asset nonexist");

    BNFTUpgradeableProxy proxy = BNFTUpgradeableProxy(payable(bNftProxy));

    if (encodedCallData.length > 0) {
      proxy.upgradeToAndCall(bNftImpl, encodedCallData);
    } else {
      proxy.upgradeTo(bNftImpl);
    }

    bNftImpls[nftAsset] = bNftImpl;

    emit BNFTUpgraded(nftAsset, bNftImpl, bNftProxy, bNftAssetLists.length);
  }

  function batchUpgradeBNFT(address[] calldata nftAssets) external override nonReentrant onlyOwner {
    require(nftAssets.length > 0, "BNFTR: empty assets");

    for (uint256 i = 0; i < nftAssets.length; i++) {
      _upgradeBNFTWithImpl(nftAssets[i], bNftGenericImpl, new bytes(0));
    }
  }

  function batchUpgradeAllBNFT() external override nonReentrant onlyOwner {
    for (uint256 i = 0; i < bNftAssetLists.length; i++) {
      _upgradeBNFTWithImpl(bNftAssetLists[i], bNftGenericImpl, new bytes(0));
    }
  }

  /**
   * @dev See {IBNFTRegistry-addCustomeSymbols}.
   */
  function addCustomeSymbols(address[] memory nftAssets_, string[] memory symbols_)
    external
    override
    nonReentrant
    onlyOwner
  {
    require(nftAssets_.length == symbols_.length, "BNFTR: inconsistent parameters");

    for (uint256 i = 0; i < nftAssets_.length; i++) {
      customSymbols[nftAssets_[i]] = symbols_[i];
    }

    emit CustomeSymbolsAdded(nftAssets_, symbols_);
  }

  /**
   * @dev Returns the address of the current claim admin.
   */
  function claimAdmin() public view virtual returns (address) {
    return _claimAdmin;
  }

  /**
   * @dev Set claim admin of the contract to a new account (`newAdmin`).
   * Can only be called by the current owner.
   */
  function setClaimAdmin(address newAdmin) public virtual onlyOwner {
    require(newAdmin != address(0), "BNFTR: new admin is the zero address");
    _setClaimAdmin(newAdmin);
  }

  /**
   * @notice Set common ERC721 and ERC1155 transfer
   * @param _transferERC721 address of the ERC721 transfer
   * @param _transferERC1155 address of the ERC1155 transfer
   */
  function setCommonTransfer(address _transferERC721, address _transferERC1155) external onlyOwner {
    TRANSFER_ERC721 = _transferERC721;
    TRANSFER_ERC1155 = _transferERC1155;
  }

  /**
   * @notice Add a transfer for a collection
   * @param collection collection address to add specific transfer rule
   * @dev It is meant to be used for exceptions only (e.g., CryptoKitties)
   */
  function addCollectionTransfer(address collection, address transfer) external onlyOwner {
    require(collection != address(0), "Owner: collection cannot be null address");
    require(transfer != address(0), "Owner: transfer cannot be null address");
    transfers[collection] = transfer;

    emit CollectionTransferAdded(collection, transfer);
  }

  /**
   * @notice Remove a transfer for a collection
   * @param collection collection address to remove exception
   */
  function removeCollectionTransfer(address collection) external onlyOwner {
    require(transfers[collection] != address(0), "Owner: collection has no transfer");

    // Set it to the address(0)
    transfers[collection] = address(0);

    emit CollectionTransferRemoved(collection);
  }

  /**
   * @notice Check the transfer for a token
   * @param collection collection address
   * @dev Support for ERC165 interface is checked AFTER custom implementation
   */
  function checkTransferForToken(address collection) external view override returns (address transfer) {
    // Assign transfer   (if any)
    transfer = transfers[collection];

    if (transfer == address(0)) {
      if (IERC165Upgradeable(collection).supportsInterface(INTERFACE_ID_ERC721)) {
        transfer = TRANSFER_ERC721;
      } else if (IERC165Upgradeable(collection).supportsInterface(INTERFACE_ID_ERC1155)) {
        transfer = TRANSFER_ERC1155;
      }
    }
  }

  function _setClaimAdmin(address newAdmin) internal virtual {
    address oldAdmin = _claimAdmin;
    _claimAdmin = newAdmin;
    emit ClaimAdminUpdated(oldAdmin, newAdmin);
  }

  function _createProxyAndInitWithImpl(address nftAsset, address bNftImpl) internal returns (address bNftProxy) {
    bytes memory initParams = _buildInitParams(nftAsset);

    BNFTUpgradeableProxy proxy = new BNFTUpgradeableProxy(bNftImpl, address(this), initParams);

    bNftProxy = address(proxy);

    bNftImpls[nftAsset] = bNftImpl;
    bNftProxys[nftAsset] = bNftProxy;
    bNftAssetLists.push(nftAsset);
  }

  function _buildInitParams(address nftAsset) internal view returns (bytes memory initParams) {
    string memory nftSymbol = customSymbols[nftAsset];
    if (bytes(nftSymbol).length == 0) {
      nftSymbol = IERC721MetadataUpgradeable(nftAsset).symbol();
    }
    string memory bNftName = string(abi.encodePacked(namePrefix, " ", nftSymbol));
    string memory bNftSymbol = string(abi.encodePacked(symbolPrefix, nftSymbol));

    initParams = abi.encodeWithSelector(
      IBNFT.initialize.selector,
      nftAsset,
      bNftName,
      bNftSymbol,
      owner(),
      claimAdmin()
    );
  }

  function _requireAddressIsERC721(address nftAsset) internal view {
    require(nftAsset != address(0), "BNFTR: asset is zero address");
    require(AddressUpgradeable.isContract(nftAsset), "BNFTR: asset is not contract");
  }
}
