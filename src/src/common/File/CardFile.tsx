import React from 'react';
import IFileDescription from './IFileDescription';
import { DocumentCard, DocumentCardType, DocumentCardDetails, DocumentCardTitle, DocumentCardActivity, DocumentCardActions } from 'office-ui-fabric-react/lib/DocumentCard';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import Auth from '../Backend/Auth';
import Settings from '../Settings';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { PrimaryButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Label } from 'office-ui-fabric-react/lib/Label';
import MessageBar from '../MessageBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

interface IProps {
    file: IFileDescription
}

interface IState {
    showShareDialog: boolean,
    showDownloadDialog: boolean,
    emailToShare: string,
    emailErrorMessage: string,
    giveReadPermission: boolean,
    giveWritePermission: boolean,
    givePublicPermission: boolean,
    waitingForShareResponse: boolean
}

class CardFile extends React.Component<IProps, IState>{

    constructor(props: IProps) {
        super(props);

        this.state = {
            showShareDialog: false,
            showDownloadDialog: false,
            emailToShare: "",
            emailErrorMessage: "",
            giveReadPermission: false,
            giveWritePermission: false,
            givePublicPermission: false,
            waitingForShareResponse: false
        }

        this.promptToDownload = this.promptToDownload.bind(this);
        this.getFile = this.getFile.bind(this);
        this.openDownloadDialog = this.openDownloadDialog.bind(this);
        this.closeDownloadDialog = this.closeDownloadDialog.bind(this);
        this.openShareDialog = this.openShareDialog.bind(this);
        this.closeShareDialog = this.closeShareDialog.bind(this);
        this.onChangeEmail = this.onChangeEmail.bind(this);
        this.onChangeReadPermission = this.onChangeReadPermission.bind(this);
        this.onChangeWritePermission = this.onChangeWritePermission.bind(this);
        this.onChangePublicPermission = this.onChangePublicPermission.bind(this);
        this.shareFile = this.shareFile.bind(this);
    }

    promptToDownload(blob: Blob, fileName: string) {
        var a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = fileName;
        a.dispatchEvent(new MouseEvent('click'));
        this.setState({ showDownloadDialog: false });
    }

    private async getFile(id: string) {
        await this.setState({ showDownloadDialog: true });

        var self = this;

        var accessToken = await Auth.GetAccessToken();
        if (accessToken != null) {
            var xhr = new XMLHttpRequest();

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        var fileInfo: IFileDescription = JSON.parse(this.response);
                        var xhr2 = new XMLHttpRequest();

                        xhr2.addEventListener("readystatechange", function () {
                            if (this.readyState === 4) {
                                if (this.status === 200) {
                                    var blob: Blob = this.response as Blob;
                                    self.promptToDownload(blob, fileInfo.fileName);
                                }
                                else {
                                    MessageBar.setMessage(this.responseText);
                                }
                                self.setState({ showDownloadDialog: false });
                            }
                        });
                        xhr2.open("GET", Settings.serverUrl + "/api/file/get/" + id);
                        xhr2.responseType = "blob";
                        xhr2.setRequestHeader("Authorization", "Bearer " + accessToken!.token);

                        xhr2.send();
                    }
                }
            });
            xhr.open("GET", Settings.serverUrl + "/api/file/info/" + id);
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken!.token);

            xhr.send();
        }
    }

    private openDownloadDialog() {
        if (this.props.file.readPermission) {
            this.setState({ showDownloadDialog: true });
        }
    }

    private closeDownloadDialog() {
        this.setState({ showDownloadDialog: false });
    }

    private openShareDialog() {
        if (this.props.file.writePermission) {
            this.setState({ showShareDialog: true });
        }
    }

    private closeShareDialog() {
        this.setState({ showShareDialog: false });
    }

    private onChangeEmail(ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) {
        this.setState({ emailToShare: newValue! });
    }

    private onChangeReadPermission(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, isChecked?: boolean): void {
        this.setState({ giveReadPermission: isChecked! })
    }

    private onChangeWritePermission(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, isChecked?: boolean): void {
        this.setState({ giveWritePermission: isChecked! })
    }

    private onChangePublicPermission(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, isChecked?: boolean): void {
        this.setState({ givePublicPermission: isChecked! })
    }

    private async shareFile() {
        await this.setState({ waitingForShareResponse: true });
        var accessToken = await Auth.GetAccessToken();
        if (accessToken != null) {
            var self = this;

            var data = {
                fileId: this.props.file!.fileId,
                email: this.state.emailToShare,
                readPermission: this.state.giveReadPermission,
                writePermission: this.state.giveWritePermission,
                publicPermission: this.state.givePublicPermission
            };

            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    console.log(this.status)
                    console.log(this.responseText)
                    if (this.status === 200) {
                        self.closeShareDialog();
                        self.setState({ emailErrorMessage: "" });
                    }
                    else if (this.status === 406) {
                        self.setState({ emailErrorMessage: this.responseText });
                    }
                    else {
                        MessageBar.setMessage(this.responseText);
                        self.closeShareDialog();
                        self.setState({ emailErrorMessage: "" });
                    }
                }
            });

            xhr.open("POST", Settings.serverUrl + "/api/file/share");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken!.token);

            xhr.send(JSON.stringify(data));
        }

        await this.setState({ waitingForShareResponse: false });
    }

    render() {
        const permissions: string[] = [];

        const properties: IButtonProps[] = [
            {
                iconProps: { iconName: 'Download' },
                onClick: async () => { await this.getFile(this.props.file!.fileId) },
                ariaLabel: 'download action'
            }
        ]

        if (this.props.file.writePermission) {
            properties.push({
                iconProps: { iconName: 'Share' },
                onClick: this.openShareDialog,
                ariaLabel: 'share action'
            });

            permissions.push("Read");
            permissions.push("Write");
        }
        else if (this.props.file.readPermission) {
            permissions.push("Read");
        }

        if (this.props.file.isPublic) {
            permissions.push("Public");
        }

        const _labelId: string = getId('dialogLabel');
        const _subTextId: string = getId('subTextLabel');

        return (
            <div>
                <DocumentCard type={DocumentCardType.normal} styles={{ root: { margin: "auto" } }}>
                    <DocumentCardTitle title={this.props.file.fileName} />
                    <DocumentCardDetails styles={{ root: { textAlign: "center" } }}>
                        <Label>
                            {permissions.join(' / ')}
                        </Label>
                    </DocumentCardDetails>
                    <DocumentCardActivity
                        activity={new Date(this.props.file.creationDate).toLocaleString()}
                        people={
                            [
                                {
                                    name: this.props.file.createdBy.firstName + ' ' + this.props.file.createdBy.lastName,
                                    profileImageSrc: '',
                                    initials: this.props.file.createdBy.firstName.charAt(0)
                                }
                            ]
                        }
                    />
                    <DocumentCardActions
                        actions={properties}
                    />
                </DocumentCard>
                <Dialog
                    hidden={!this.state.showDownloadDialog}
                    onDismiss={this.closeDownloadDialog}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: 'Downloading ' + this.props.file!.fileName,
                        subText: ''
                    }}
                >
                    <Spinner size={SpinnerSize.large} />
                </Dialog>
                <Dialog
                    hidden={!this.state.showShareDialog}
                    onDismiss={this.closeShareDialog}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: 'Share ' + this.props.file!.fileName,
                        subText: ''
                    }}
                    modalProps={{
                        titleAriaId: _labelId,
                        subtitleAriaId: _subTextId,
                        isBlocking: false,
                        styles: { main: { maxWidth: 450 } },
                        dragOptions: undefined
                    }}
                >
                    <TextField
                        label="Email"
                        value={this.state.emailToShare}
                        onChange={this.onChangeEmail}
                        disabled={!(this.state.giveReadPermission || this.state.giveWritePermission)}
                        errorMessage={(this.state.emailErrorMessage) ? this.state.emailErrorMessage : undefined}
                        required
                    />
                    <Checkbox
                        label="Read Permissions"
                        checked={this.state.giveReadPermission}
                        onChange={this.onChangeReadPermission}
                    />
                    <Checkbox
                        label="Write Permissions"
                        checked={this.state.giveWritePermission}
                        onChange={this.onChangeWritePermission}
                    />
                    <hr />
                    <Checkbox
                        label="Public"
                        checked={this.state.givePublicPermission}
                        onChange={this.onChangePublicPermission}
                    />
                    <DialogFooter>
                        <PrimaryButton
                            text="Share"
                            onClick={async () => { await this.shareFile(); }}
                            disabled={!(this.state.giveReadPermission || this.state.giveWritePermission || this.state.givePublicPermission) || this.state.waitingForShareResponse}
                        />
                    </DialogFooter>
                </Dialog>
            </div >
        );
    }
}

export default CardFile;