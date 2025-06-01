import ky from "ky"

interface SignInProps {
    accessToken: string
}

export const signIn = async (props: SignInProps): Promise<SignInSuccessResponseSchema> => {
    const { accessToken } = props
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`
    console.log("calling login api")
    try{
        const response = await ky.post(apiUrl, {json: {accessToken}}).json<SignInSuccessResponseSchema>()
        return response
    } catch(e){
        console.log("Error while sign in: ", e)
        throw e
    }
}

interface GoogleUserType {
	email: string;
	name: string;
	picture: string;
	googleId: string;
}

interface SignInSuccessResponseSchema {
    userDetails: GoogleUserType
}