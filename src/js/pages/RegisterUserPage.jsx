import React, { useEffect, useState } from 'react';
import Field from '../components/forms/Field';
import authAPI from '../services/authAPI';
import jwt_decode from "jwt-decode";
import UserAPI from "../services/usersAPI";
import { Link } from 'react-router-dom';
import Loader from 'react-loader-spinner';
import notification from '../services/notification';

const RegisterUserPage = (props) => {
  const { token } = props.match.params;

  const [users, setUsers] = useState({
    club: "",
    roles: [""],
    email: "",
    lastName: "",
    firstName: "",
    birthday: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const [errors, setErrors] = useState({
    lastName: "",
    firstName: "",
    birthday: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const [loading, setLoading] = useState(false)

  //à l'arrivée sur la page -> série de controle
  //1. je logout si jamais il y a déja un token de stocké dans le localstorage (cas où un autre utilisateur s'est connecté à l'appil précédemment avec le meme ordi/tablette )
  if (window.localStorage.getItem("authToken")) {
    authAPI.logout();
  }

  //2. je vérifie si le token de l'url est valide
  useEffect(() => {
    try {
      const decoded = jwt_decode(token);

      if (decoded.firstName !== '') {  //cas où quelqu'un essaye de se co à cette page avec un token valide récupérer à quelqu'un d'existant....
        console.log("token invalide")
        //TODO : flash error -> token invalide ! 
        props.history.push('/login')
      }
      setUsers({
        ...users,
        'club': '/api/clubs/' + decoded.club,
        'email': decoded.username,
        'roles': [decoded.roles[0]]
      })
    } catch (error) {
      console.log(error.message)
      //TODO : flash error -> token invalide ! 
      props.history.push('/login')
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  //gestion des changements des inputs dans le formulaire
  const handleChange = (event) => {
    const { name, value } = event.currentTarget;
    setUsers({ ...users, [name]: value });
  };

  /**
  * Call ajax lors de la soumission du formulaire pour créer le coach et l'utilisateur associé
  */
  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    const apiErrors = {};
    if (users.password !== users.passwordConfirm) {
      apiErrors.passwordConfirm =
        "Votre confimation de mot de passe n'est pas conforme";
      setErrors(apiErrors);
      setLoading(false)
      notification.errorNotif("Erreur dans le formulaire d'inscription")
      return;
    }

    //création User
    try {
      const response = await UserAPI.registerUser(users);
      //création Coach
      try {
        if (users.roles[0] === "ROLE_COACH") {
          await UserAPI.registerCoach(response, token)
          setLoading(false)
        } else if (users.roles[0] === "ROLE_PLAYER") {
          await UserAPI.registerPlayer(response, token)
          setLoading(false)
        }

        //TODO : faire un petit FLASH de success
        notification.successNotif("Bravo vous compte a été créé !")
        //on efface les messages d'erreur et on renvoi sur la page de login
        setErrors("");
        props.history.push("/login");
      } catch (error) {
        alert(
          "Erreur interne, compte utilisateur créé mais non assigné en tant que ROLE_COACH ou ROLE_PLAYER. contactez administrateur du site"
        );
        setLoading(false)
      }
    } catch (error) {
      notification.errorNotif("Erreur dans le formulaire d'inscription")
      const { violations } = error.response.data;
      //si l'utilisateur essaye de se créer un second compte à partir du lien d'inscription qu'il a reçu, il y aura dans les violations
      //  le message concernant l'adresse mail (violations['email'] = 'cette email est déja utilisé)
      // dans ce cas redirigé l'utilisateur vers la page de login avec un flash -> "vous avez deja créer votre compte"
      if (violations) {
        violations.forEach((violation) => {
          if (violation.propertyPath === 'email') {
            notification.warningNotif("Vous avez déja un compte utilisateur pour cette email")
            props.history.push("/login");
          }
          apiErrors[violation.propertyPath] = violation.message;
        });
        setErrors(apiErrors);
        setLoading(false)
      }
    }
  }

  return (
    <>
      { (users.roles[0] === "ROLE_COACH") ? <h1>Inscription Nouveau Coach</h1> : <h1>Inscription Nouveau Joueur</h1>}
      <form onSubmit={handleSubmit}>
        <Field
          name="firstName"
          label="Prénom"
          placeholder="Votre prénom..."
          onChange={handleChange}
          value={users.firstName}
          error={errors.firstName}
        ></Field>
        <Field
          name="lastName"
          label="Nom"
          placeholder="Votre nom..."
          onChange={handleChange}
          value={users.lastName}
          error={errors.lastName}
        ></Field>
        <Field
          name="phone"
          label="Téléphone"
          placeholder="Votre numéro de téléphone..."
          onChange={handleChange}
          value={users.phone}
          error={errors.phone}
        ></Field>
        <Field
          name="birthday"
          label="Date de naissance"
          type="date"
          onChange={handleChange}
          value={users.birthday}
          error={errors.birthday}
        ></Field>
        <Field
          name="password"
          label="Mot de passe"
          type="password"
          placeholder="Votre mot de passe..."
          onChange={handleChange}
          value={users.password}
          error={errors.password}
        ></Field>
        <Field
          name="passwordConfirm"
          label="Confirmation de mot de passe"
          type="password"
          placeholder="Confirmez votre mot de passe..."
          onChange={handleChange}
          value={users.passwordConfirm}
          error={errors.passwordConfirm}
        ></Field>

        <div className="form-group">
          {!loading && (
            <button type="submit" className="btn btn-success">
              Confirmation
            </button>
          )}
          {loading && (
            <Loader type="ThreeDots" width="60" height="40" color="LightGray" />
          )}
          <Link to="/login" className="btn btn-link">
            J'ai déjà un compte
          </Link>
        </div>
      </form>
    </>
  );
}

export default RegisterUserPage;