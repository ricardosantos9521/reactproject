import IProfile from "../Account/IProfile";
import Settings from "../Settings";
import Auth from "./Auth";
import MessageBar from "../MessageBar";
import { ErrorMessages } from "../ErrorMessages";

class Profile {
    private static profile: IProfile | null = JSON.parse(localStorage.getItem("profile")!);

    public static async Get(): Promise<IProfile> {
        var self = this;

        return new Promise(async function (resolve, reject) {
            var accessToken = await Auth.GetAccessToken();
            if (accessToken != null) {

                var xhr = new XMLHttpRequest();

                xhr.addEventListener("readystatechange", function () {

                    if (this.readyState !== 4) return;

                    if (this.readyState === 4) {
                        if (this.status === 200) {
                            var profile: IProfile = JSON.parse(this.response);
                            localStorage.setItem("profile", JSON.stringify(profile));
                            self.profile = { ...profile };
                            dispatchEvent(new CustomEvent("profileChanged", { detail: self.profile }));
                            resolve(profile);
                        }
                        else if (this.status === 404 || this.status === 0) {
                            MessageBar.setMessage(ErrorMessages.CannotAccessServer);
                        }
                        else {
                            MessageBar.setMessage(this.responseText);
                        }
                    }
                });

                xhr.open("GET", Settings.serverUrl + "/api/profile/");
                xhr.setRequestHeader("Authorization", "Bearer " + accessToken!.token);

                xhr.send(null);
            }
        });
    }

    public static Change(profile: IProfile, propertieschanged: Array<String>): Promise<any> {

        return new Promise(async function (resolve, reject) {
            var accessToken = await Auth.GetAccessToken();
            if (accessToken != null) {
                var xhr = new XMLHttpRequest();

                xhr.addEventListener("readystatechange", function () {

                    if (this.readyState !== 4) return;

                    if (this.readyState === 4) {
                        if (this.status === 200) {
                            resolve();
                        }
                        else if (this.status === 404 || this.status === 0) {
                            MessageBar.setMessage(ErrorMessages.CannotAccessServer);
                        }
                        else {
                            MessageBar.setMessage(this.responseText);
                        }
                    }
                });

                xhr.open("POST", Settings.serverUrl + "/api/profile/");
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization", "Bearer " + accessToken!.token);

                xhr.send(JSON.stringify({
                    "profile": profile,
                    "propertieschanged": propertieschanged
                }));
            }
        });
    }

    public static DeleteLocalProfile() {
        localStorage.removeItem("profile");
        this.profile = null;
        dispatchEvent(new CustomEvent("profileChanged", { detail: this.profile }));
    }

    public static SubscribeChanges(onProfileChanged: (event: CustomEvent<IProfile | null>) => void): IProfile | null {
        window.addEventListener("profileChanged", onProfileChanged as EventListener);

        return this.profile;
    }

    public static UnSubscribeChanges(onProfileChanged: (event: CustomEvent<IProfile | null>) => void) {
        window.removeEventListener("profileChanged", onProfileChanged as EventListener);
    }
}

export default Profile;