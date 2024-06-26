import { useState, useEffect } from 'react';
import {
  RekognitionClient,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition';
import Loading from './assets/images/loading.gif';

function App() {
  const [imageBytes, setImageBytes] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageWidth, setImageWidth] = useState('50vw');

  const [faces, setFaces] = useState([]);
  const boundingBoxStyles = {
    position: 'absolute',
    border: '2px solid #00FF00', // Cor da borda verde
    pointerEvents: 'none', // Para permitir interação com a imagem abaixo
    boxSizing: 'border-box', // Para incluir a borda no tamanho total
  };

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      console.log(viewportWidth);

      const newImageWidth = viewportWidth <= 500 ? `90vw` : '50vw';
      setImageWidth(newImageWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const handleChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      setFaces([]);
      setImageURL(event.target.result);

      const arrayBuffer = event.target.result.split(',')[1];
      const binaryString = window.atob(arrayBuffer);

      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }

      setImageBytes(byteArray);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const client = new RekognitionClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      MaxLabels: 50,
      MinConfidence: 70,
      Attributes: ['DEFAULT'],
    });

    const response = await client.send(command);

    const newFaces = response.FaceDetails.map((faceDetail) => faceDetail);
    setFaces(newFaces);
    console.log(newFaces);
    setLoading(false);
  };

  return (
    <>
      <div className='d-grid justify-content-center'>
        <div className='d-flex gap-2 m-4 '>
          <input
            className='form-control'
            type='file'
            accept='image/*'
            id='formFile'
            multiple={false}
            onChange={handleChange}
          />
          <button
            className='btn btn-primary'
            onClick={handleSubmit}
          >
            Enviar
          </button>
        </div>
      </div>
      <div className='d-grid justify-content-center'>
        {loading && (
          <img
            src={Loading}
            alt='Processando...'
            className=' loading mb-3'
          />
        )}
      </div>
      <div className='d-grid justify-content-center'>
        <div
          style={{
            position: 'relative',
            width: imageWidth,
          }}
        >
          <img
            hidden={imageURL == ''}
            src={imageURL}
            style={{
              position: 'relative',
              width: imageWidth,
            }}
            className=''
            alt='Imagem'
          />
          {faces.length > 0 &&
            faces.map((face, index) => {
              const { Left, Top, Width, Height } = face.BoundingBox;
              return (
                <div
                  key={index}
                  style={{
                    ...boundingBoxStyles,
                    left: `${Left * 100}%`,
                    top: `${Top * 100}%`,
                    width: `${Width * 100}%`,
                    height: `${Height * 100}%`,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {index}
                  </span>
                </div>
              );
            })}
          {faces.length > 0 &&
            faces.map((face, index) => {
              const { Left, Top, Width, Height } = face.BoundingBox;
              const { Yaw, Pitch, Roll } = face.Pose;
              const scale = 1.5; // Ajuste conforme necessário
              // Calcula o comprimento das linhas com base no tamanho do bounding box
              const lineLength = 200;
              //  Math.min(Width * 100, Height * 100) * 0.9 * scale;

              // Calcula as coordenadas para o centro do bounding box
              const centerX = Left * 100 + Width * 50;
              const centerY = Top * 100 + Height * 50;

              // Calcula as coordenadas finais para as linhas com base nos ângulos
              const yawX = centerX + lineLength * Math.sin(Yaw);
              const yawY = centerY - lineLength * Math.cos(Yaw);

              const pitchX = centerX + lineLength * Math.sin(Pitch);
              const pitchY = centerY - lineLength * Math.cos(Pitch);

              const rollX = centerX + lineLength * Math.sin(Roll);
              const rollY = centerY - lineLength * Math.cos(Roll);

              return (
                <svg
                  key={index}
                  style={{
                    position: 'absolute',
                    width: `${Width * 100}%`,
                    height: `${Height * 100}%`,
                    left: `${Left * 100}%`,
                    top: `${Top * 100}%`,
                  }}
                  viewBox={`0 0 100 100`}
                >
                  {/* Yaw */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={yawX}
                    y2={yawY}
                    stroke='red'
                    strokeWidth='2'
                  />
                  {/* Pitch */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={pitchX}
                    y2={pitchY}
                    stroke='blue'
                    strokeWidth='2'
                  />
                  {/* Roll */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={rollX}
                    y2={rollY}
                    stroke='green'
                    strokeWidth='2'
                  />
                </svg>
              );
            })}
        </div>
      </div>

      <div className='d-grid justify-content-center p-4'>
        <div className='table-responsive table-stripped'>
          <table
            className='table table-striped table-hover'
            hidden={faces.length === 0}
          >
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th className='text-center'>Frontal</th>
                <th className='text-center'>Cabeça abaixada</th>
                <th className='text-secondary text-center'>Pitch (x)</th>
                <th className='text-danger text-center'>Yaw (y)</th>
                <th className='text-success text-center'>Roll (z)</th>
              </tr>
            </thead>
            <tbody>
              {faces.length > 0 &&
                faces.map((face, index) => (
                  <tr key={index}>
                    <td>{index}</td>
                    <td className='text-center'>
                      {face.Pose.Pitch < -1
                        ? 'Não'
                        : face.Pose.Yaw < 8 && face.Pose.Yaw > -8
                        ? 'Sim'
                        : 'Não'}
                      {/* {face.Pose.Yaw < 8 && face.Pose.Yaw > -8 ? 'Sim' : 'Não'} */}
                    </td>
                    <td className='text-center'>
                      {face.Pose.Pitch < -1 ? 'Sim' : 'Não'}
                    </td>
                    <td className='text-end'>{face.Pose.Pitch}</td>
                    <td className='text-end'>{face.Pose.Yaw}</td>
                    <td className='text-end'>{face.Pose.Roll}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
