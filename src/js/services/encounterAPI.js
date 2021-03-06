import Axios from "axios";
import { ENCOUNTERS_API, TEAMS_API } from "../../config";


function findAllEncounters() {
    return Axios
        .get(ENCOUNTERS_API)
        .then(response => response.data['hydra:member'])
}

function findEncountersById(teamId) {
    return Axios.get(TEAMS_API + '/' + teamId + '/encounters')
}




function deleteEncounter(id) {
    return Axios
        .delete(ENCOUNTERS_API + "/" + id)
}

function postEncounter(encounter) {
    return Axios.post(ENCOUNTERS_API, encounter)

}

function putEncounter(encounterId, teamLabel, dateEncounter, label, category) {
    return Axios
        .put(ENCOUNTERS_API + "/" + encounterId,
            {
                team: teamLabel,
                date: dateEncounter,
                labelOpposingTeam: label,
                categoryOpposingTeam: category,
            }
        )
    //.then(response => response.data['hydra:member'])
}

export default {
    findAllEncounters,
    deleteEncounter,
    postEncounter,
    putEncounter,
    findEncountersById,
}