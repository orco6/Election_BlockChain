pragma solidity ^0.5.0;

contract Election {
	
	struct Candidate {
        uint id;
        string name;        
    }
    int public votingTimeEnd;
    uint public candCount;

    mapping(uint => uint) private voteCount;
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;

    event votedEvent (
        uint indexed _candidateId
    );

	 constructor() public {
        candCount = 0;
        votingTimeEnd = int(block.timestamp) + 86400;
        addCandidate("Yair Lapid");
        addCandidate("Benjamin Netanyau");
        addCandidate("Naftali Benet");
        addCandidate("Beni Gantz");
    }

    function addCandidate (string memory _name) private {
        candidates[candCount] = Candidate(candCount, _name);
        voteCount[candCount] = 0; 
        candCount ++;
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        require(int(block.timestamp) <= votingTimeEnd);
        
        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        voteCount[_candidateId] ++;
        
        // trigger voted event
        emit votedEvent(_candidateId);
    }

    function results() public view returns (uint[] memory){
        uint[] memory ret = new uint[](candCount);
        for (uint i = 0; i < candCount ; i++) {
            ret[i] = voteCount[i];
        }
        return ret;
    }

    function getTime() public view returns (int){
        return votingTimeEnd;
    }
}