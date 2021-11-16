# FirstCall 
### Gig management software for musicians and freelancers

For details about the app itself, please see the [GitBook documentation](https://ryantuckern.gitbook.io/first-call/).

### Forking the Project

Create a local PostgreSQL database named 'first-call'

Clone this repo as well as [the client](https://github.com/RyanTuckerN/first-call-client).

```cd server && npm i```


Once dependancies are installed, create a ```.env``` file and provide the following information:

- ```PORT``` = 3333
- ```JWT_SECRET``` = '<ADD_A_SECRET_HERE>'
- ```DATABASE_URL``` =  'postgresql://<your-postgres-username>:<your-postgres-password>@localhost/first-call'

open ```./helpers/newEmail.js``` and comment out 93-107, otherwise you will get errors in your console!

run ```npm start``` or ```nodemon``` in the terminal to start the server.