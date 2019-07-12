import React from 'react';
import Settings from '../Settings';
import IFileDescription from './IFileDescription';
import CardFile from './CardFile';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { INavBarOptions } from '../Navigation/INavBarOptions';
import { handleOkResponse, handleBadRequest, handleCannotAccessServer, handleUnauthorized, handleNotAcceptable } from '../Helpers/HandleResponsesXHR';
import { setAuthorizationHeader } from '../Helpers/Authorization';

interface IProps {
    setNavBarOptions?(newNavBarOptions: INavBarOptions): void
}

interface IState {
    uploadButtonEnabled: Boolean,
    fileInfo: IFileDescription | null
}

class UploadFile extends React.Component<IProps, IState>{

    file: File | null = null;

    constructor(props: IProps) {
        super(props);

        this.state = {
            uploadButtonEnabled: false,
            fileInfo: null
        }

        this.props.setNavBarOptions!(new INavBarOptions("Upload", false));

        this.fileSelected = this.fileSelected.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }

    fileSelected(event: React.ChangeEvent<HTMLInputElement>) {
        var file = event.target.files![0];
        if (file !== undefined) {
            this.file = file;
            this.setState({ uploadButtonEnabled: true, fileInfo: null });
        }
    }

    async uploadFile() {
        if (this.file !== null) {
            var self = this;
            var data = new FormData();
            data.append("file", this.file);

            var xhr = new XMLHttpRequest();

            xhr.addEventListener("readystatechange", async function () {
                if (this.readyState === 4) {
                    handleOkResponse(this, (r) => {
                        var fileInfo = JSON.parse(r.responseText);
                        self.setState({ fileInfo });
                    })

                    handleBadRequest(this);

                    handleCannotAccessServer(this);

                    handleUnauthorized(this);

                    handleNotAcceptable(this);
                }
            });

            xhr.open("POST", Settings.serverUrl + "/api/file/upload");
            await setAuthorizationHeader(xhr);

            xhr.send(data);
        }
    }

    render() {

        return (
            <div>
                <input type="file" name="file" onChange={this.fileSelected} />
                <DefaultButton text="upload" onClick={this.uploadFile} disabled={!this.state.uploadButtonEnabled} />
                {
                    (this.state.fileInfo !== null) && (
                        <CardFile file={this.state.fileInfo} uniqueKey={1} />
                    )
                }
            </div >
        );
    }
}

export default UploadFile;