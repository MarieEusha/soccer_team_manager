import Axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import TeamContext from '../contexts/TeamContext';
import Calendar from "../components/Calendar";
import Modal from "../components/Modal";
import Field from "../components/forms/Field";
import Textarea from "../components/forms/Textarea";
import '../../scss/pages/TrainingsPage.scss';

const TrainingsPage = () => {

    const [trainings, setTrainings] = useState([])
    //au chargement de la page on récupére l'id de la currentTeam selectionné
    // on charge tous les entrainements la concernant
    // !!!! -> la tableau trainings doit ressembler à ça:  trainings = [ {training.date, training.id ...}, {training.date, training.id ...}, ....]
    const { currentTeamId } = useContext(TeamContext)
    useEffect(() => {
        if (currentTeamId !== '') {
            Axios.get('http://localhost:8000/api/teams/' + currentTeamId + '/trainings')
                .then(response => {
                    setTrainings(response.data['hydra:member'])
                })
                .catch(error => {
                    console.log(error.response)
                })
        }
    }, [currentTeamId])


    const [show, setShow] = useState(false)

    const showModal = () => {
        setShow(true)
    }

    const hideModal = () => {
        setShow(false)
    }

    const handleChange = (event) => {
        const { name, value } = event.currentTarget;
        setTraining({ ...training, [name]: value });
    };

    const [titleModal, setTitleModal] = useState('')
    const [newer, setNewer] = useState(true)

    const [training, setTraining] = useState({
        team: "",
        date: "",
        label: "",
        description: ""
    })
    const [errors, setErrors] = useState({
        label: "",
        description: ""
    })
    const [currentTrainingId, setCurrentTrainingId] = useState('')

    const onDateClick = (day) => {
        //parcours trainings, si un item training correspond a la date cliqué  on set training avec celui-ci trouvé & on change title avec "Modifier l'entrainement"
        setTraining({
            ...training,
            team: "/api/teams/" + currentTeamId,
            date: day.toLocaleDateString('fr-CA'),
            label: "",
            description: "",
        })
        setCurrentTrainingId('')
        setTitleModal('Ajouter un entrainement au ' + day.toLocaleDateString('fr-FR'))
        setNewer(true)
        setErrors('');
        for (var i = 0; i < trainings.length; i++) {
            if (new Date(trainings[i].date).toLocaleDateString('fr-FR') === day.toLocaleDateString('fr-FR')) {
                setTraining({
                    ...training,
                    team: "/api/teams/" + currentTeamId,
                    date: day.toLocaleDateString('fr-CA'),
                    label: trainings[i].label,
                    description: trainings[i].description,
                })
                setCurrentTrainingId(trainings[i].id)
                setTitleModal('Modifier l\'entrainement du ' + day.toLocaleDateString('fr-FR'))
                setNewer(false)
                break;
            }
        }
        showModal()
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        //si newer == true ---> requete en POST pour création d'un nouveau training
        if (newer === true) {
            Axios.post('http://localhost:8000/api/trainings', training)
                .then(response => {
                    //si réussite ---> refaire la requete http du useEffect pour mettre a jour le tableau trainings
                    Axios.get('http://localhost:8000/api/teams/' + currentTeamId + '/trainings')
                        .then(response => {
                            setTrainings(response.data['hydra:member'])
                        })
                        .catch(error => {
                            console.log(error.response)
                        })
                    //flash success

                    //vider les message d'erreur eventuels
                    setErrors('');
                    //fermer la fenetre modal
                    hideModal()
                })
                .catch(error => {
                    //si echec ---> affichage des violations dans le formulaire
                    const violations = error.response.data.violations;
                    const apiErrors = {};
                    if (violations) {
                        violations.forEach((violation) => {
                            apiErrors[violation.propertyPath] = violation.message;
                        });
                    }
                    setErrors(apiErrors);
                })
        } else {    //si newer == false ---->requete en PUT  pour modif training existant au jour selectionné
            Axios.put('http://localhost:8000/api/trainings/' + currentTrainingId, training)
                .then(response => {
                    //si réussite ---> refaire la requete http du useEffect pour mettre a jour le tableau trainings
                    Axios.get('http://localhost:8000/api/teams/' + currentTeamId + '/trainings')
                        .then(response => {
                            setTrainings(response.data['hydra:member'])
                        })
                        .catch(error => {
                            console.log(error.response)
                        })
                    //flash success

                    //vider les message d'erreur eventuels
                    setErrors('');
                    //fermer la fenetre modal
                    hideModal()
                })
                .catch(error => {
                    //si echec ---> affichage des violations dans le formulaire
                    const violations = error.response.data.violations;
                    const apiErrors = {};
                    if (violations) {
                        violations.forEach((violation) => {
                            apiErrors[violation.propertyPath] = violation.message;
                        });
                    }
                    setErrors(apiErrors);
                })
        }








    }

    const handleDelete = (trainingId) => {
        console.log(trainingId)
        //copie du tableau trainings
        const originalTrainings = [...trainings]
        //retirer du tableau trainings le training selectionné
        setTrainings(trainings.filter((trainingItem) => trainingItem.id !== trainingId))
        //requete DEL pour le dégager de la BDD
        Axios.delete('http://localhost:8000/api/trainings/' + trainingId)
            .then(response => {
                //si réussite --> falsh success
                console.log("success")
                hideModal()
            })
            .catch(error => {
                //en cas d'echec remettre le tableau trainings comme avant
                console.log(error.response)
                setTrainings(originalTrainings)
            })
    }

    return (
        <div className="wrapper_container TrainingsPage">
            <Calendar
                parentCallBack={onDateClick}
                events={trainings}
            >
            </Calendar>

            <Modal
                show={show}
                handleClose={hideModal}
                title={titleModal}
            >
                <form onSubmit={handleSubmit}>
                    <Field
                        name="label"
                        label="Titre"
                        placeholder="Titre de l'entrainement..."
                        value={training.label}
                        onChange={handleChange}
                        error={errors.label}
                    ></Field>
                    <Textarea
                        name="description"
                        label="Description"
                        placeholder="Programme de l'entrainement..."
                        value={training.description}
                        onChange={handleChange}
                        error={errors.description}
                    ></Textarea>
                    <div className="form-group submit-btn">
                        <button type="submit" className="btn btn-primary ">
                            {newer ? 'Créer' : 'Modifier'}
                        </button>
                        {!newer && (
                            <button type="button" className="btn btn-danger" onClick={() => handleDelete(training.id)}>
                                Supprimer
                            </button>
                        )}
                    </div>
                </form>
            </Modal>


        </div>
    );
}

export default TrainingsPage;