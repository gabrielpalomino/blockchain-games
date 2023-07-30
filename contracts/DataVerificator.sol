pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

contract DataVerificator {
    function verify(string memory data, string memory salt, bytes memory signature, address originalSender, bytes32 originalData) internal pure {
        bytes32 dataHash = getDataHash(data, salt);
        bytes32 ethSignedDataHash = getEthSignedDataHash(dataHash);
        require(recoverSigner(ethSignedDataHash, signature) == originalSender, "Data not signed by the initial sender.");
        require(originalData == dataHash, "Original data not matching hashed data.");
    }

    function getDataHash(string memory data, string memory salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(data, salt));
    }

    function getEthSignedDataHash(
        bytes32 _messageHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length.");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}